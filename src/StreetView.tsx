import { ComponentProps, useEffect, useRef, useState } from "react";
import { Location } from "./type";
import requestIdleCallbackSafari from "./util/requestIdleCallbackSafari";

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function StreetView({
  location,
  ...props
}: {
  location: Location | undefined;
} & ComponentProps<"div">) {
  const [panorama, setPanorama] = useState<
    google.maps.StreetViewPanorama | undefined
  >();

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
    if (window.requestIdleCallback) {
      window.requestIdleCallback(onIdle);
    } else {
      // Safari & iOS
      requestIdleCallbackSafari().request(onIdle);
    }
  }, []);

  useEffect(() => {
    if (panorama && location) {
      panorama.setPosition(location);
    }
  }, [location?.lat, location?.lng, panorama]);

  useEffect(() => {
    const run = async () => {
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
    run();
  }, [location?.lat, location?.lng, panorama]);

  return (
    <div {...props}>
      <div ref={streetViewRef} className="static"></div>
    </div>
  );
}
