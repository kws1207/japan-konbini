import { useState } from "react";
import { StreetView } from "./StreetView";
import { PLACE_LABEL, PlaceType } from "./type";

function App() {
  const [placeType, setPlaceType] = useState<PlaceType>("convenience_store");
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      />
    </div>
  );
}

export default App;
