import { PlaceType } from "./type";
import { useRandomPlace } from "./useRandomPlace";
import { ComponentProps, useEffect, useRef, useState } from "react";

// eslint-disable-next-line no-var, react-refresh/only-export-components
export var map: google.maps.Map;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function StreetView({
  placeType,
  count,
  ...props
}: { placeType: PlaceType; count: number } & ComponentProps<"div">) {
  const { location, refresh } = useRandomPlace(placeType);

  const [panorama, setPanorama] = useState<
    google.maps.StreetViewPanorama | undefined
  >();

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!location) return;
    const el = document.getElementById("street-view");
    if (!el) return;

    setPanorama(
      new google.maps.StreetViewPanorama(el, {
        position: location,
        addressControlOptions: {
          position: google.maps.ControlPosition.LEFT_CENTER,
        },
        fullscreenControl: false,
      })
    );
  }, [location, placeType]);

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
  }, [panorama]);

  useEffect(() => {
    if (count > 0) {
      refresh();
    }
  }, [count]);

  useEffect(() => {
    if (mapRef.current) {
      map = new google.maps.Map(mapRef.current);
    }
  }, []);

  return (
    <div {...props}>
      <div id="map" ref={mapRef}></div>
      <div id="street-view" className="static"></div>
    </div>
  );
}
