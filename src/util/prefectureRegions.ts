import type { Region } from "../type";

// Maps GeoJSON `properties.nam` values from public/japan.json to the eight
// commonly used Japanese regions. Keys must match the source data exactly.
export const PREFECTURE_REGION: Record<string, Region> = {
  "Hokkai Do": "Hokkaido",

  "Aomori Ken": "Tohoku",
  "Iwate Ken": "Tohoku",
  "Miyagi Ken": "Tohoku",
  "Akita Ken": "Tohoku",
  "Yamagata Ken": "Tohoku",
  "Fukushima Ken": "Tohoku",

  "Ibaraki Ken": "Kanto",
  "Tochigi Ken": "Kanto",
  "Gunma Ken": "Kanto",
  "Saitama Ken": "Kanto",
  "Chiba Ken": "Kanto",
  "Tokyo To": "Kanto",
  "Kanagawa Ken": "Kanto",

  "Niigata Ken": "Chubu",
  "Toyama Ken": "Chubu",
  "Ishikawa Ken": "Chubu",
  "Fukui Ken": "Chubu",
  "Yamanashi Ken": "Chubu",
  "Nagano Ken": "Chubu",
  "Gifu Ken": "Chubu",
  "Shizuoka Ken": "Chubu",
  "Aichi Ken": "Chubu",

  "Mie Ken": "Kinki",
  "Shiga Ken": "Kinki",
  "Kyoto Fu": "Kinki",
  "Osaka Fu": "Kinki",
  "Hyogo Ken": "Kinki",
  "Nara Ken": "Kinki",
  "Wakayama Ken": "Kinki",

  "Tottori Ken": "Chugoku",
  "Shimane Ken": "Chugoku",
  "Okayama Ken": "Chugoku",
  "Hiroshima Ken": "Chugoku",
  "Yamaguchi Ken": "Chugoku",

  "Tokushima Ken": "Shikoku",
  "Kagawa Ken": "Shikoku",
  "Ehime Ken": "Shikoku",
  "Kochi Ken": "Shikoku",

  "Fukuoka Ken": "Kyushu",
  "Saga Ken": "Kyushu",
  "Nagasaki Ken": "Kyushu",
  "Kumamoto Ken": "Kyushu",
  "Oita Ken": "Kyushu",
  "Miyazaki Ken": "Kyushu",
  "Kagoshima Ken": "Kyushu",
  "Okinawa Ken": "Kyushu",
};
