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

      {/* Desktop chrome — md and above (guidebook header) */}
      <header className="hidden md:flex top-0 z-50 absolute w-[100vw] bg-cream border-b border-black/10 flex-col items-start gap-[14px] px-[28px] py-[22px] text-neutral-900">
        <div
          className="absolute top-[18px] right-[28px] border-2 border-vermillion text-vermillion px-[10px] py-[6px] rounded-[2px] font-serif font-bold text-[10px] tracking-[2px] rotate-[-6deg] select-none"
          aria-hidden="true"
        >
          JAPAN EXPLORE
        </div>
        <div className="flex flex-col gap-[2px]">
          <div
            className="font-serif text-[13px] text-vermillion tracking-[3px] mb-[2px]"
            aria-hidden="true"
          >
            日本各地をランダム探索
          </div>
          <h1 className="font-serif font-bold text-[28px] leading-tight tracking-tight">
            Random Places in <span className="text-vermillion">Japan</span>
          </h1>
          <span className="text-[13px] text-neutral-600">
            Let's explore random places in japan. Choose place type and hit Go!
          </span>
        </div>
        <div className="flex flex-row items-center justify-start gap-[8px] flex-wrap w-full">
          {(Object.entries(PLACE_LABEL) as [PlaceType, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                className={`px-[14px] py-[8px] text-[13px] font-medium rounded-sm border transition-colors flex items-center gap-[6px] ${
                  key === placeType
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500"
                }`}
                onClick={() => setPlaceType(key)}
              >
                <span className="text-[14px]" aria-hidden="true">
                  {PLACE_ICON[key]}
                </span>
                {label}
              </button>
            )
          )}
          <PrefectureCombobox
            features={jpGeoJson?.features}
            value={selected}
            onChange={setSelected}
            disabled={!isLoaded}
            variant="desktop"
          />
          <button
            type="button"
            className={`ml-auto rounded-sm px-[22px] py-[10px] text-[13px] font-semibold tracking-wider text-white transition-transform ${
              disabled
                ? "bg-neutral-400 shadow-none"
                : "bg-vermillion shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#1a1a1a]"
            }`}
            onClick={refresh}
            disabled={disabled}
          >
            {!isLoaded
              ? "Loading map data..."
              : isLoading
              ? "Loading..."
              : "➡️ Go!"}
          </button>
          <button
            type="button"
            onClick={share}
            disabled={!location}
            className="rounded-sm border border-neutral-300 bg-white px-[14px] py-[8px] text-[13px] text-neutral-800 hover:border-neutral-500 disabled:opacity-60"
          >
            Share
          </button>
        </div>
      </header>

      {/* Mobile chrome — below md (BottomSheet + FAB) */}
      <div className="md:hidden">
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
            variant="mobile"
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
      </div>

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
