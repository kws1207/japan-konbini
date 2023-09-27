import { useEffect, useState } from "react";
import { StreetView } from "./StreetView";
import { PLACE_LABEL, PlaceType } from "./type";
import jpGeoJson from "./assets/japan.json";

const jpGeoJsonAny = jpGeoJson as any;

function App() {
  const [placeType, setPlaceType] = useState<PlaceType>("convenience_store");
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState("All Prefecture");
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (selected === "All Prefecture") {
      setIndex(-1);
      return;
    }

    const newIndex = (jpGeoJsonAny.features as any[]).findIndex(
      ({ properties }) => properties.nam === selected
    );
    setIndex(newIndex);
  }, [selected]);

  return (
    <div className="flex flex-col h-[100vh]">
      <div className="top-0 z-50 absolute bottom-0 w-[100vw] bg-black opacity-75 h-fit flex flex-col items-start gap-[12px] text-white px-[12px] py-[8px]">
        <div className="flex flex-col gap-[2px]">
          <h1 className="font-semibold text-[24px]">Random Places in Japan</h1>
          <span className="text-[12px]">
            Let's explore random places in japan. Choose place type and hit Go!
          </span>
        </div>
        <div className="flex flex-row items-center justify-start gap-[16px]">
          {Object.entries(PLACE_LABEL).map(([key, label]) => (
            <button
              key={key}
              className={key === placeType ? "text-green-500" : "text-white"}
              onClick={() => setPlaceType(key as PlaceType)}
            >
              {label}
            </button>
          ))}

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-black"
          >
            <option value="All Prefecture">All Prefecture</option>
            {(jpGeoJsonAny.features as any[]).map(({ properties }) => (
              <option value={properties.nam} key={properties.nam}>
                {properties.nam}
              </option>
            ))}
          </select>
          <button
            className={`${
              isLoading ? "bg-gray-300" : "bg-green-500"
            } rounded px-[12px] py-[2px]`}
            onClick={() => setCount((prev) => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "➡️ Go!"}
          </button>
        </div>
      </div>
      <StreetView
        placeType={placeType}
        count={count}
        setIsLoading={setIsLoading}
        index={index}
      />
    </div>
  );
}

export default App;
