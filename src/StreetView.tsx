import { useSetAtom } from "jotai";
import { PlaceType } from "./type";
import { useRandomPlace } from "./useRandomPlace";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { mapAtom } from "./atoms";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function StreetView({
  placeType,
  count,
  setIsLoading,
  index,
  ...props
}: {
  placeType: PlaceType;
  count: number;
  setIsLoading: (_: boolean) => void;
  index: number;
} & ComponentProps<"div">) {
  const setMap = useSetAtom(mapAtom);
  const { location, refresh } = useRandomPlace(placeType, index);

  const [panorama, setPanorama] = useState<
    google.maps.StreetViewPanorama | undefined
  >();

  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);

  const onIdle = () => {
    streetViewRef.current &&
      setPanorama(
        new google.maps.StreetViewPanorama(streetViewRef.current, {
          position: location,
          addressControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER,
          },
          fullscreenControl: false,
        })
      );
  };

  useEffect(() => {
    window.requestIdleCallback(onIdle);
  }, []);

  useEffect(() => {
    if (panorama && location) {
      setIsLoading(true);
      panorama?.setPosition(location);
    }

    setIsLoading(false);
  }, [JSON.stringify(location), placeType]);

  const asyncJob = async () => {
    if (!location || !panorama) return;

    await sleep(1000);

    const panoPos = panorama.getLocation();

    if (panoPos && panoPos.latLng) {
      const heading = google.maps.geometry.spherical.computeHeading(
        panoPos.latLng,
        location
      );

      panorama.setPov({ heading, pitch: 0 });
    }
  };

  useEffect(() => {
    asyncJob();
  }, [JSON.stringify(panorama?.getLocation())]);

  useEffect(() => {
    if (count > 0) {
      setIsLoading(true);
      refresh();
    }
  }, [count, placeType]);

  useEffect(() => {
    if (mapRef.current) {
      setMap(new google.maps.Map(mapRef.current));
    }
  }, []);

  return (
    <div {...props}>
      <div ref={mapRef}></div>
      <div ref={streetViewRef} className="static"></div>
    </div>
  );
}
