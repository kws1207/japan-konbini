import { useState, useEffect } from "react";
import * as d3 from "d3";
import jpGeoJson from "./asset/japan.json";
import { PlaceType, Location } from "./type";
import { useAtomValue } from "jotai";
import { mapAtom } from "./atom";

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
  const map = useAtomValue(mapAtom);
  const [baseLoaction, setBaseLocation] = useState<Location | undefined>();
  const [storeLocation, setStoreLocation] = useState<Location | undefined>();

  const generateBaseLocation = async () => {
    const [lat, lng] = randomFeatureCoordinates(
      // eslint-disable-next-line
      // @ts-ignore
      jpGeoJson.features[
        index !== -1 ? index : Math.floor(Math.random() * 46)
      ] as d3.ExtendedFeature
    )().reverse();

    setBaseLocation({ lat, lng });
  };

  const searchNearBy = (radius: number) => {
    if (!baseLoaction || !map) return undefined;

    const service = new google.maps.places.PlacesService(map);

    return new Promise<google.maps.places.PlaceResult | undefined>(
      (resolve) => {
        if (placeType === "starbucks") {
          const textRequest: google.maps.places.TextSearchRequest = {
            location: baseLoaction,
            radius,
            query: "Starbucks Coffee",
            type: "cafe",
          };

          service.textSearch(textRequest, (res) => {
            if (!res || res.length === 0) {
              resolve(undefined);
              return;
            }

            const randomIndex = Math.floor(Math.random() * (res.length - 1));

            resolve(res[randomIndex]);
          });
        } else {
          const request: google.maps.places.PlaceSearchRequest = {
            location: baseLoaction,
            radius,
            type: placeType,
          };

          service.nearbySearch(request, (res) => {
            if (!res || res.length === 0) {
              resolve(undefined);
              return;
            }

            const randomIndex = Math.floor(Math.random() * (res.length - 1));

            resolve(res[randomIndex]);
          });
        }
      }
    );
  };

  const searchStore = async () => {
    const radii = [500, 5000, 50000];

    for (const radius of radii) {
      const result = await searchNearBy(radius);
      if (result) {
        return result;
      }
    }

    return undefined;
  };

  const asyncJob = async () => {
    const newStore = await searchStore();

    const newStoreLocation = newStore?.geometry?.location;

    setStoreLocation(
      newStoreLocation && {
        lat: newStoreLocation.lat(),
        lng: newStoreLocation.lng(),
      }
    );
  };

  const refresh = () => {
    setStoreLocation(undefined);
    generateBaseLocation();
  };

  useEffect(() => {
    if (!storeLocation && !baseLoaction) {
      generateBaseLocation();
    }

    if (baseLoaction && !storeLocation) {
      asyncJob();
    }
  }, [JSON.stringify(baseLoaction), JSON.stringify(storeLocation)]);

  useEffect(() => {
    refresh();
  }, [placeType, index]);

  return {
    location: storeLocation,
    refresh,
  };
}
