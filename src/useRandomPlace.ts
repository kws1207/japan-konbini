import { useState, useEffect } from "react";
import * as d3 from "d3";
import jpGeoJson from "./assets/japan.json";
import { PlaceType, Location } from "./type";
import { useAtomValue } from "jotai";
import { mapAtom } from "./atoms";

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

export function useRandomPlace(placeType: PlaceType) {
  const map = useAtomValue(mapAtom);
  const [baseLoaction, setBaseLocation] = useState<Location | undefined>();
  const [storeLocation, setStoreLocation] = useState<Location | undefined>();

  const generateBaseLocation = async () => {
    const [lat, lng] = randomFeatureCoordinates(
      // eslint-disable-next-line
      // @ts-ignore
      jpGeoJson.features[Math.floor(Math.random() * 46)] as d3.ExtendedFeature
    )().reverse();

    setBaseLocation({ lat, lng });
  };

  const searchNearBy = (radius: number) => {
    if (!baseLoaction || !map) return undefined;

    const service = new google.maps.places.PlacesService(map);

    return new Promise<google.maps.places.PlaceResult | undefined>(
      (resolve) => {
        service.nearbySearch(
          { location: baseLoaction, type: placeType, radius },
          (res) => {
            if (!res || res.length === 0) {
              resolve(undefined);
              return;
            }

            const randomIndex = Math.floor(Math.random() * (res.length - 1));

            resolve(res[randomIndex]);
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
  }, [placeType]);

  return {
    location: storeLocation,
    refresh,
  };
}
