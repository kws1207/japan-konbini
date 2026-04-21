import { useEffect, useState } from "react";
import { StreetView } from "./StreetView";
import { PLACE_ICON, PLACE_LABEL, PlaceType } from "./type";
import { useRandomPlace } from "./useRandomPlace";
import { useJapanGeoJson } from "./useJapanGeoJson";

function App() {
  const [placeType, setPlaceType] = useState<PlaceType>("convenience_store");
  const [selected, setSelected] = useState("All Prefecture");
  const [index, setIndex] = useState(-1);

  const { data: jpGeoJson, isLoaded } = useJapanGeoJson();

  useEffect(() => {
    if (!jpGeoJson) return;
    if (selected === "All Prefecture") {
      setIndex(-1);
      return;
    }

    const newIndex = jpGeoJson.features.findIndex(
      (f) => f.properties?.nam === selected
    );
    setIndex(newIndex);
  }, [selected, jpGeoJson]);

  const { location, isLoading, refresh } = useRandomPlace(placeType, index);

  const disabled = !isLoaded || isLoading;

  return (
    <div className="flex flex-col h-[100vh]">
      <div className="top-0 z-50 absolute w-[100vw] bg-cream border-b border-black/10 flex flex-col items-start gap-[14px] px-[28px] py-[22px] text-neutral-900">
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
          {Object.entries(PLACE_LABEL).map(([key, label]) => (
            <button
              key={key}
              className={`px-[14px] py-[8px] text-[13px] font-medium rounded-sm border transition-colors flex items-center gap-[6px] ${
                key === placeType
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500"
              }`}
              onClick={() => setPlaceType(key as PlaceType)}
            >
              <span className="text-[14px]" aria-hidden="true">
                {PLACE_ICON[key as PlaceType]}
              </span>
              {label}
            </button>
          ))}

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-white text-neutral-800 border border-neutral-300 rounded-sm px-[14px] py-[8px] text-[13px] disabled:opacity-60"
            disabled={!isLoaded}
          >
            <option value="All Prefecture">All Prefecture</option>
            {jpGeoJson?.features.map((f) => {
              const name = f.properties?.nam as string | undefined;
              if (!name) return null;
              return (
                <option value={name} key={name}>
                  {name}
                </option>
              );
            })}
          </select>
          <button
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
        </div>
      </div>
      <StreetView location={location} />
    </div>
  );
}

export default App;
