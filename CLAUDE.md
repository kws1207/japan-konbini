# japan-konbini

일본 전역에서 편의점/기차역/스타벅스를 랜덤으로 뽑아 Google Street View로 보여주는 React SPA. Netlify 자동 배포 (https://randomplacesjapan.netlify.app).

## 명령어

- `yarn dev` — 로컬 서버 (HTTPS, mkcert)
- `yarn build` — `tsc && vite build` (타입 체크 포함)
- `yarn lint` — ESLint `--max-warnings 0`

패키지 매니저는 **Yarn Berry (node-modules linker)** 이다. `npm`/`pnpm`으로 설치하지 말 것.

## 검증

테스트 프레임워크도 CI도 없다. 코드 수정 후 반드시:

1. `yarn lint && yarn build` 통과 확인
2. `yarn dev`로 띄워 **브라우저에서 Go! 버튼을 눌러 Street View가 실제로 뜨는지 수동 확인**. 장소 타입(편의점/역/스타벅스), 특정 prefecture 선택, 전국 모드를 최소 한 번씩 시도.

코드 정확성을 타입체커/린터만으로 판단하지 말 것 — 이 앱 버그의 대부분은 `useEffect` 타이밍·Google Maps 전역 초기화 순서에서 발생하므로 런타임 확인이 필수.

## 코드 스타일

- TypeScript strict. 신규 코드에 `any` 캐스팅과 `@ts-ignore` 추가 금지. GeoJSON은 `d3.ExtendedFeature` / `FeatureCollection` 로 좁혀라.
- ESLint warning은 곧 빌드 실패다.
- 주석은 "왜"만 적는다.

## 반드시 알아야 할 아키텍처 사실

코드만 보고는 오해하기 쉬운 지점들:

- **Google Maps API는 `index.html:45`의 `<script>` 태그로 전역 로드된다.** 앱은 `google.maps.*` 전역을 직접 쓴다. 과거의 `@react-google-maps/api` 의존성은 제거됐다 — 로더로 감싸는 변경을 하려면 전역 로드 방식까지 한 번에 재설계하라.
- **API 키는 `index.html`에 하드코딩**되어 있고 `randomplacesjapan.netlify.app` 도메인 제한으로 보호된다. 로컬에서 404/Referer 에러가 나면 키가 아니라 도메인 제한 설정을 확인하라.
- **`PlacesService`는 DOM에 부착하지 않은 `document.createElement("div")` 로 생성한다** (`useRandomPlace.ts`). 과거에는 `StreetView`가 만든 `google.maps.Map` 인스턴스를 `mapAtom`으로 공유했지만 — Dynamic Map 과금 유발 — 생성자 시그니처가 `HTMLDivElement | Map` 이라 div만으로 충분하다. jotai / `src/atom.ts` 는 제거됨. 다시 Map 인스턴스를 넘기는 방향으로 되돌리지 말 것.
- **Google Maps 스크립트 로딩이 비동기라 앱 마운트 시 `google` 전역이 없을 수 있다.** `StreetView.tsx`는 `requestIdleCallback` (+ Safari 폴리필 `src/util/requestIdleCallbackSafari.js`) 로 초기화를 미루고, `useRandomPlace`는 `typeof google !== "undefined" && google.maps?.places` 가드 + `setTimeout` 폴링으로 `PlacesService` 생성을 지연한다. 두 순서 의존성을 깨지 말 것.
- **`isLoading` / `location` 소유권은 `useRandomPlace` 훅에 있다.** `App`이 훅을 호출해서 Go! 버튼과 `<StreetView location={...} />`로 분배한다. `StreetView`는 더 이상 훅을 호출하지 않으며, 로딩 상태를 prop으로 받지 않는다 — 이 단방향 흐름을 유지하라.
- **`japan.json` (12 MB, 47 prefecture `FeatureCollection`) 은 JS 번들에 인라인되지 않고 런타임에 `fetch("/japan.json")` 으로 로드한다.** `useJapanGeoJson` 훅이 모듈 스코프 Promise 캐시로 단일 fetch를 보장한다. `App` 은 `isLoaded` 로 prefecture `<select>` 와 Go! 버튼을 게이트하고, `useRandomPlace` 는 `data` 가 도착할 때까지 `generateBaseLocation` 을 no-op 처리한다. 다시 `import "./asset/japan.json"` 으로 되돌리면 번들이 12 MB로 부풀어 초기 로드가 망가진다.

## 도메인 상수

- `public/japan.json` — 47개 도도부현 `FeatureCollection`. 이름 키는 `properties.nam` (예: `"Tokyo"`). 정적 에셋으로 서빙되며 `public/_headers` 가 `Cache-Control: public, max-age=86400` 를 설정한다 (파일명에 해시가 없어 `immutable` 금지, 24시간 한정). 파일 내용을 바꿀 땐 캐시 TTL 지난 뒤에야 클라이언트가 갱신된다는 점을 기억할 것.
- `PlaceType = "convenience_store" | "train_station" | "starbucks"`. 스타벅스만 `textSearch(query: "Starbucks Coffee")`, 나머지는 `nearbySearch(type)` 로 분기.
- 검색은 랜덤 base point마다 `5000m` 반경으로 한 번 수행한다. `ZERO_RESULTS` 는 대기 없이 다음 base point로 넘기고, `UNKNOWN_ERROR` 만 짧게 재시도한다. 일반 실패마다 `sleep(1000)` 을 넣으면 Go! 버튼 tail latency가 다시 10초대로 늘어난다.
- `index === -1` 은 "전국 무작위" 를 의미한다.

## 현존 기술부채 (건드릴 때 주의)

- `StreetView.tsx` — `StreetViewPanorama` 는 초기 위치 없이 생성하고, 이후 `location` effect가 `setPosition` / POV 보정을 담당한다.
