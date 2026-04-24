import { useEffect, useMemo, useState } from "react";
import { StreetView } from "./StreetView";
import { PLACE_ICON, PLACE_LABEL, PlaceType } from "./type";
import { useRandomPlace } from "./useRandomPlace";
import { useJapanGeoJson } from "./useJapanGeoJson";
import { BottomSheet } from "./components/BottomSheet";
import { SegmentedControl } from "./components/SegmentedControl";
import { PrefectureCombobox } from "./components/PrefectureCombobox";
import { GoFab } from "./components/GoFab";
import { readStateFromUrl, writeStateToUrl } from "./util/urlState";

const PLACE_OPTIONS = [
  {
    value: "convenience_store" as const,
    label: "Convenience",
    icon: PLACE_ICON.convenience_store,
  },
  {
    value: "train_station" as const,
    label: "Train",
    icon: PLACE_ICON.train_station,
  },
  {
    value: "starbucks" as const,
    label: "Starbucks",
    icon: PLACE_ICON.starbucks,
  },
] as const;

function App() {
  const initialUrlState = useMemo(() => readStateFromUrl(), []);
  const [placeType, setPlaceType] = useState<PlaceType>(
    initialUrlState.placeType ?? "convenience_store"
  );
  const [selected, setSelected] = useState(
    initialUrlState.prefecture ?? "All Prefecture"
  );
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: jpGeoJson, isLoaded } = useJapanGeoJson();

  const { location, isLoading, refresh } = useRandomPlace(
    placeType,
    selected,
    initialUrlState.location
  );

  const disabled = !isLoaded || isLoading;

  useEffect(() => {
    writeStateToUrl({ placeType, prefecture: selected, location });
  }, [placeType, selected, location]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Random Places in Japan", url });
        return;
      } catch {
        // User dismissed the share sheet — fall through to clipboard copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast("Copy failed");
    }
  };

  const statusMessage = isLoading
    ? "Loading new location…"
    : location
    ? `Showing ${PLACE_LABEL[placeType]}${
        selected !== "All Prefecture" ? ` in ${selected}` : ""
      }`
    : "";

  return (
    <div className="relative h-[100dvh] w-[100vw] overflow-hidden bg-neutral-900">
      <StreetView location={location} className="absolute inset-0" />

      {isLoading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
        >
          <span className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <GoFab onClick={refresh} disabled={disabled} isLoading={isLoading} />

      <BottomSheet
        expanded={sheetExpanded}
        onToggleExpanded={() => setSheetExpanded((v) => !v)}
        peek={
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-800">
              <span aria-hidden="true">{PLACE_ICON[placeType]}</span>
              {PLACE_LABEL[placeType]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-800">
              <span aria-hidden="true">📍</span>
              {selected}
            </span>
          </>
        }
      >
        <SegmentedControl
          label="Place type"
          value={placeType}
          onChange={setPlaceType}
          options={PLACE_OPTIONS}
        />
        <PrefectureCombobox
          features={jpGeoJson?.features}
          value={selected}
          onChange={setSelected}
          disabled={!isLoaded}
        />
        <button
          type="button"
          onClick={share}
          disabled={!location}
          className="self-start rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 hover:border-neutral-500 disabled:opacity-60"
        >
          Share this spot
        </button>
      </BottomSheet>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-neutral-900 text-white text-sm px-4 py-2 rounded-full shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
