import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { Location } from "./type";
import { sleep } from "./util/sleep";
import requestIdleCallbackSafari from "./util/requestIdleCallbackSafari";

const MAX_HEADING_ATTEMPTS = 20;

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

  const onIdle = useCallback(() => {
    streetViewRef.current &&
      setPanorama(
        new google.maps.StreetViewPanorama(streetViewRef.current, {
          addressControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER,
          },
          fullscreenControl: false,
        })
      );
  }, []);

  useEffect(() => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(onIdle);
    } else {
      // Safari & iOS
      requestIdleCallbackSafari().request(onIdle);
    }
  }, [onIdle]);

  useEffect(() => {
    if (panorama && location) {
      panorama.setPosition(location);
    }
  }, [location, panorama]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    let headingAttempts = 0;

    const alignHeading = () => {
      if (cancelled || !location || !panorama) return;

      const panoPos = panorama.getLocation();

      if (!panoPos?.latLng) {
        headingAttempts += 1;
        if (headingAttempts < MAX_HEADING_ATTEMPTS) {
          retryTimer = window.setTimeout(alignHeading, 100);
        }
        return;
      }

      const heading = google.maps.geometry.spherical.computeHeading(
        panoPos.latLng,
        location
      );

      if (!cancelled) {
        panorama.setPov({ heading, pitch: 0 });
      }
    };

    const run = async () => {
      if (!location || !panorama) return;

      await sleep(1000);

      if (cancelled) return;
      alignHeading();
    };
    run();
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [location, panorama]);

  return (
    <div {...props}>
      <div ref={streetViewRef} className="static"></div>
    </div>
  );
}
