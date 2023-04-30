import { useState, useEffect } from "react";
import { map } from "./App";
import * as d3 from "d3";
import jpGeoJson from "./assets/japan.json";

type Location = {
  lat: number;
  lng: number;
};

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

export function useStoreLocation() {
  const [baseLoaction, setBaseLocation] = useState<Location | undefined>();
  const [storeLocation, setStoreLocation] = useState<Location | undefined>();

  const generateBaseLocation = async () => {
    const [lat, lng] = randomFeatureCoordinates(
      jpGeoJson.features[Math.floor(Math.random() * 46)] as d3.ExtendedFeature
    )().reverse();

    setBaseLocation({ lat, lng });
  };

  const searchNearBy = (radius: number) => {
    if (!baseLoaction) return undefined;

    const service = new google.maps.places.PlacesService(map);

    return new Promise<google.maps.places.PlaceResult | undefined>(
      (resolve) => {
        service.nearbySearch(
          { location: baseLoaction, type: "convenience_store", radius },
          (res) => {
            if (!res || res.length == 0) {
              resolve(undefined);
              return;
            }

            resolve(res[0]);
          }
        );
      }
    );
  };

  const searchStore = async () => {
    const a = await searchNearBy(500);
    if (a) {
      return a;
    }
    const b = await searchNearBy(5000);
    if (b) {
      return b;
    }
    const c = await searchNearBy(50000);
    if (c) {
      return c;
    }
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

  useEffect(() => {
    if (!storeLocation && !baseLoaction) {
      generateBaseLocation();
    }

    if (baseLoaction && !storeLocation) {
      asyncJob();
    }
  }, [baseLoaction, storeLocation]);

  return {
    location: storeLocation,
  };
}
