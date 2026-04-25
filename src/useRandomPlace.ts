import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { PlaceType, Location } from "./type";
import { sleep } from "./util/sleep";
import { useJapanGeoJson } from "./useJapanGeoJson";

const SEARCH_RADIUS_METERS = 5000;
const MAX_BASE_LOCATION_ATTEMPTS = 8;
const MAX_SEARCH_ROUNDS = 2;
const RETRYABLE_STATUS_DELAY_MS = 250;
const MAX_RETRYABLE_STATUS_RETRIES = 1;

type PlacesStatus = google.maps.places.PlacesServiceStatus | string;

type PlaceSearchOutcome =
  | { type: "found"; place: google.maps.places.PlaceResult }
  | { type: "empty"; status: PlacesStatus }
  | { type: "retryable"; status: PlacesStatus }
  | { type: "fatal"; status: PlacesStatus }
  | { type: "stale" };

// https://observablehq.com/@jeffreymorganio/random-coordinates-within-a-country
function randomBoundingBoxCoordinates(boundingBox: number[][]) {
  const randomLongitude = d3.randomUniform(
    boundingBox[0][0],
    boundingBox[1][0] + 360 * (boundingBox[1][0] < boundingBox[0][0] ? 1 : 0)
  );
  const randomLatitude = d3.randomUniform(boundingBox[0][1], boundingBox[1][1]);
  return () => [randomLongitude(), randomLatitude()];
}

function randomFeatureCoordinates(feature: d3.ExtendedFeature) {
  const featureBoundingBox = d3.geoBounds(feature);
  const randomCoordinates = randomBoundingBoxCoordinates(featureBoundingBox);
  return () => {
    let p;
    do {
      p = randomCoordinates();
    } while (!d3.geoContains(feature, p as [number, number]));
    return p;
  };
}

export function useRandomPlace(
  placeType: PlaceType,
  prefecture: string,
  initialLocation?: Location
) {
  const { data: jpGeoJson } = useJapanGeoJson();
  const [storeLocation, setStoreLocation] = useState<Location | undefined>(
    initialLocation
  );
  const [isLoading, setIsLoading] = useState(!initialLocation);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);
  const requestIdRef = useRef(0);
  // Suppress the auto-search on mount when we hydrate from a shared URL.
  // Release happens only when placeType/prefecture change from the values
  // captured at mount or when refresh() is called explicitly — the
  // asynchronous resolution of `prefecture -> index` must not trip it.
  const skipAutoSearchRef = useRef<boolean>(initialLocation !== undefined);
  const lastInputsRef = useRef({ placeType, prefecture });

  const index = useMemo(() => {
    if (!jpGeoJson || prefecture === "All Prefecture") return -1;
    return jpGeoJson.features.findIndex(
      (f) => f.properties?.nam === prefecture
    );
  }, [jpGeoJson, prefecture]);

  useEffect(() => {
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (typeof google !== "undefined" && google.maps?.places) {
        const container = document.createElement("div");
        serviceRef.current = new google.maps.places.PlacesService(container);
        setIsServiceReady(true);
        return;
      }
      setTimeout(tryInit, 100);
    };
    tryInit();
    return () => {
      cancelled = true;
      serviceRef.current = null;
      setIsServiceReady(false);
    };
  }, []);

  const generateBaseLocation = useCallback(() => {
    if (!jpGeoJson) return undefined;

    const feature =
      jpGeoJson.features[
        index !== -1 ? index : Math.floor(Math.random() * jpGeoJson.features.length)
      ];

    const [lat, lng] = randomFeatureCoordinates(
      feature as d3.ExtendedFeature
    )().reverse();

    return { lat, lng };
  }, [index, jpGeoJson]);

  // textSearch (Starbucks) treats location/radius as a bias, not a hard filter,
  // so prominent results outside Japan (e.g. Busan from a Fukuoka base point)
  // can be returned. Verify result coords against the loaded prefecture polygons.
  const isInJapanBounds = useCallback(
    (point: [number, number]): boolean => {
      if (!jpGeoJson) return false;
      return jpGeoJson.features.some((f) =>
        d3.geoContains(f as d3.ExtendedFeature, point)
      );
    },
    [jpGeoJson]
  );

  const searchNearBy = useCallback(
    (location: Location, radius: number, requestId: number) => {
      if (requestIdRef.current !== requestId || !serviceRef.current) {
        return Promise.resolve<PlaceSearchOutcome>({ type: "stale" });
      }

      const service = serviceRef.current;

      return new Promise<PlaceSearchOutcome>((resolve) => {
        const handleResult = (
          res: google.maps.places.PlaceResult[] | null,
          status: PlacesStatus
        ) => {
          if (requestIdRef.current !== requestId) {
            resolve({ type: "stale" });
            return;
          }

          if (status === "OK" && res && res.length > 0) {
            const randomIndex = Math.floor(Math.random() * res.length);
            resolve({ type: "found", place: res[randomIndex] });
            return;
          }

          if (status === "OK" || status === "ZERO_RESULTS") {
            resolve({ type: "empty", status });
            return;
          }

          if (status === "UNKNOWN_ERROR") {
            resolve({ type: "retryable", status });
            return;
          }

          resolve({ type: "fatal", status });
        };

        if (placeType === "starbucks") {
          const textRequest: google.maps.places.TextSearchRequest = {
            location,
            radius,
            query: "Starbucks Coffee",
            type: "cafe",
          };

          service.textSearch(textRequest, handleResult);
          return;
        }

        const request: google.maps.places.PlaceSearchRequest = {
          location,
          radius,
          type: placeType,
        };

        service.nearbySearch(request, (res, status) => {
          handleResult(res, status);
        });
      });
    },
    [placeType]
  );

  const searchStore = useCallback(
    async (
      baseLocation: Location,
      requestId: number
    ): Promise<PlaceSearchOutcome> => {
      for (
        let retry = 0;
        retry <= MAX_RETRYABLE_STATUS_RETRIES;
        retry += 1
      ) {
        if (requestIdRef.current !== requestId) {
          return { type: "stale" };
        }

        const result = await searchNearBy(
          baseLocation,
          SEARCH_RADIUS_METERS,
          requestId
        );

        if (requestIdRef.current !== requestId) {
          return { type: "stale" };
        }

        if (result.type !== "retryable") {
          return result;
        }

        if (retry < MAX_RETRYABLE_STATUS_RETRIES) {
          await sleep(RETRYABLE_STATUS_DELAY_MS);
        }
      }

      return { type: "retryable", status: "UNKNOWN_ERROR" };
    },
    [searchNearBy]
  );

  const runSearch = useCallback(
    async (requestId: number) => {
      setIsLoading(true);

      if (!jpGeoJson || !isServiceReady) {
        return;
      }

      for (let round = 0; round < MAX_SEARCH_ROUNDS; round += 1) {
        for (
          let attempt = 0;
          attempt < MAX_BASE_LOCATION_ATTEMPTS;
          attempt += 1
        ) {
          if (requestIdRef.current !== requestId) {
            return;
          }

          const baseLocation = generateBaseLocation();
          if (!baseLocation) {
            setIsLoading(false);
            return;
          }

          const result = await searchStore(baseLocation, requestId);

          if (requestIdRef.current !== requestId) {
            return;
          }

          if (result.type === "stale") {
            return;
          }

          if (result.type === "fatal") {
            setIsLoading(false);
            return;
          }

          if (result.type === "found") {
            const newStoreLocation = result.place.geometry?.location;
            if (!newStoreLocation) {
              continue;
            }
            const lat = newStoreLocation.lat();
            const lng = newStoreLocation.lng();
            if (!isInJapanBounds([lng, lat])) {
              continue;
            }
            setStoreLocation({ lat, lng });
            setIsLoading(false);
            return;
          }
        }
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      setStoreLocation(undefined);
      setIsLoading(false);
    },
    [generateBaseLocation, isInJapanBounds, isServiceReady, jpGeoJson, searchStore]
  );

  const refresh = useCallback(() => {
    skipAutoSearchRef.current = false;
    requestIdRef.current += 1;
    void runSearch(requestIdRef.current);
  }, [runSearch]);

  // A `loc=` shared before the boundary fix landed could point outside Japan
  // (e.g. Busan). Once the geojson is loaded, drop such hydrated coords and
  // trigger a fresh search instead of stranding the user on a foreign result.
  useEffect(() => {
    if (!jpGeoJson || !initialLocation || !skipAutoSearchRef.current) return;
    if (isInJapanBounds([initialLocation.lng, initialLocation.lat])) return;
    skipAutoSearchRef.current = false;
    setStoreLocation(undefined);
    requestIdRef.current += 1;
    void runSearch(requestIdRef.current);
  }, [initialLocation, isInJapanBounds, jpGeoJson, runSearch]);

  useEffect(() => {
    const inputsChanged =
      lastInputsRef.current.placeType !== placeType ||
      lastInputsRef.current.prefecture !== prefecture;

    if (inputsChanged) {
      lastInputsRef.current = { placeType, prefecture };
      skipAutoSearchRef.current = false;
    }

    if (skipAutoSearchRef.current) {
      return;
    }

    requestIdRef.current += 1;
    void runSearch(requestIdRef.current);
  }, [runSearch, placeType, prefecture]);

  return {
    location: storeLocation,
    isLoading,
    refresh,
  };
}
