export type Location = {
  lat: number;
  lng: number;
};

export type PlaceType = "convenience_store" | "train_station" | "starbucks";

export const PLACE_LABEL: { [key in PlaceType]: string } = {
  convenience_store: "Convenience Store",
  train_station: "Train Station",
  starbucks: "Starbucks",
} as const;

export const PLACE_ICON: { [key in PlaceType]: string } = {
  convenience_store: "🍙",
  train_station: "🚉",
  starbucks: "☕",
} as const;
