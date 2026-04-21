import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import jpGeoJson from "./asset/japan.json";
import { PlaceType, Location } from "./type";
import { sleep } from "./util/sleep";

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

export function useRandomPlace(placeType: PlaceType, index: number) {
  const [baseLoaction, setBaseLocation] = useState<Location | undefined>();
  const [storeLocation, setStoreLocation] = useState<Location | undefined>();
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (typeof google !== "undefined" && google.maps?.places) {
        const container = document.createElement("div");
        serviceRef.current = new google.maps.places.PlacesService(container);
        return;
      }
      setTimeout(tryInit, 100);
    };
    tryInit();
    return () => {
      cancelled = true;
      serviceRef.current = null;
    };
  }, []);

  const generateBaseLocation = useCallback(
    async (requestId = requestIdRef.current) => {
      const [lat, lng] = randomFeatureCoordinates(
        // eslint-disable-next-line
        // @ts-ignore
        jpGeoJson.features[
          index !== -1
            ? index
            : Math.floor(Math.random() * jpGeoJson.features.length)
        ] as d3.ExtendedFeature
      )().reverse();

      if (requestIdRef.current !== requestId) {
        return;
      }

      setBaseLocation({ lat, lng });
    },
    [index]
  );

  const searchNearBy = useCallback(
    (radius: number, requestId: number) => {
      if (
        requestIdRef.current !== requestId ||
        !baseLoaction ||
        !serviceRef.current
      ) {
        return Promise.resolve(undefined);
      }

      const service = serviceRef.current;

      return new Promise<google.maps.places.PlaceResult | undefined>(
        (resolve) => {
          const handleResult = (
            res: google.maps.places.PlaceResult[] | null,
            status: string
          ) => {
            if (requestIdRef.current !== requestId) {
              resolve(undefined);
              return;
            }

            if (status !== "OK" || !res || res.length === 0) {
              resolve(undefined);
              return;
            }

            const randomIndex = Math.floor(Math.random() * res.length);

            resolve(res[randomIndex]);
          };

          if (placeType === "starbucks") {
            const textRequest: google.maps.places.TextSearchRequest = {
              location: baseLoaction,
              radius,
              query: "Starbucks Coffee",
              type: "cafe",
            };

            service.textSearch(textRequest, handleResult);
            return;
          }

          const request: google.maps.places.PlaceSearchRequest = {
            location: baseLoaction,
            radius,
            type: placeType,
          };

          service.nearbySearch(request, (res, status) => {
            handleResult(res, status);
          });
        }
      );
    },
    [baseLoaction, placeType]
  );

  const searchStore = useCallback(
    async (requestId: number) => {
      const radii = [50, 500, 5000];

      for (const radius of radii) {
        if (requestIdRef.current !== requestId) {
          return undefined;
        }

        const result = await searchNearBy(radius, requestId);
        if (requestIdRef.current !== requestId) {
          return undefined;
        }

        if (result) {
          return result;
        }

        await sleep(1000);
      }

      return undefined;
    },
    [searchNearBy]
  );

  const refresh = useCallback(() => {
    requestIdRef.current += 1;
    setStoreLocation(undefined);
    setBaseLocation(undefined);
    generateBaseLocation(requestIdRef.current);
  }, [generateBaseLocation]);

  const asyncJob = useCallback(
    async (requestId: number) => {
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const newStore = await searchStore(requestId);

        if (requestIdRef.current !== requestId) {
          return;
        }

        const newStoreLocation = newStore?.geometry?.location;

        if (newStoreLocation) {
          setStoreLocation({
            lat: newStoreLocation.lat(),
            lng: newStoreLocation.lng(),
          });
          return;
        }

        await sleep(1000);
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      refresh();
    },
    [refresh, searchStore]
  );

  useEffect(() => {
    if (!storeLocation && !baseLoaction) {
      generateBaseLocation(requestIdRef.current);
    }
  }, [baseLoaction, storeLocation, generateBaseLocation]);

  useEffect(() => {
    if (baseLoaction && !storeLocation) {
      const currentRequestId = requestIdRef.current;
      asyncJob(currentRequestId);
    }
  }, [asyncJob, baseLoaction, storeLocation]);

  useEffect(() => {
    refresh();
  }, [placeType, index, refresh]);

  return {
    location: storeLocation,
    isLoading: !storeLocation,
    refresh,
  };
}
