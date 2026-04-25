import { PLACE_LABEL, Location, PlaceType } from "../type";
import { PREFECTURE_REGION } from "./prefectureRegions";

export type AppUrlState = {
  placeType?: PlaceType;
  prefecture?: string;
  location?: Location;
};

function isPlaceType(v: string): v is PlaceType {
  return Object.prototype.hasOwnProperty.call(PLACE_LABEL, v);
}

function isKnownPrefecture(v: string): boolean {
  return Object.prototype.hasOwnProperty.call(PREFECTURE_REGION, v);
}

export function readStateFromUrl(): AppUrlState {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const state: AppUrlState = {};

  const cat = params.get("cat");
  if (cat && isPlaceType(cat)) state.placeType = cat;

  // Drop unknown values so the displayed label cannot diverge from the
  // searched region (unknown pref silently maps to nationwide via index=-1).
  const pref = params.get("pref");
  if (pref && isKnownPrefecture(pref)) state.prefecture = pref;

  const loc = params.get("loc");
  if (loc) {
    const [latStr, lngStr] = loc.split(",");
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      state.location = { lat, lng };
    }
  }

  return state;
}

export function writeStateToUrl(s: AppUrlState): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (s.placeType) params.set("cat", s.placeType);
  else params.delete("cat");

  if (s.prefecture && s.prefecture !== "All Prefecture") {
    params.set("pref", s.prefecture);
  } else {
    params.delete("pref");
  }

  if (s.location) {
    params.set(
      "loc",
      `${s.location.lat.toFixed(6)},${s.location.lng.toFixed(6)}`
    );
  } else {
    params.delete("loc");
  }

  const query = params.toString();
  const next = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(null, "", next);
}
