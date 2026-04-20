import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

// Module-scoped promise cache: ensures a single fetch across all hook callers
// within the SPA lifetime. React strict-mode double-invocation also reuses it.
let cache: Promise<FeatureCollection> | undefined;

function load(): Promise<FeatureCollection> {
  if (!cache) {
    cache = fetch("/japan.json").then((res) => {
      if (!res.ok) {
        cache = undefined;
        throw new Error(`Failed to load japan.json: ${res.status}`);
      }
      return res.json() as Promise<FeatureCollection>;
    });
  }
  return cache;
}

export function useJapanGeoJson() {
  const [data, setData] = useState<FeatureCollection | undefined>();

  useEffect(() => {
    let cancelled = false;
    load()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Leaving data undefined keeps the UI in loading state; retry on next mount.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoaded: !!data };
}
