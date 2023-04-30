import { useStoreLocation } from "./useStoreLocation";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line no-var, react-refresh/only-export-components
export var map: google.maps.Map;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function App() {
  const { location } = useStoreLocation();

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
      })
    );
  }, [location]);

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
    if (mapRef.current) {
      map = new google.maps.Map(mapRef.current);
    }
  }, []);

  return (
    <>
      <div id="map" className="h-[100%]" ref={mapRef}></div>
      <div id="street-view" className="h-[100%] static"></div>
    </>
  );
}

export default App;
