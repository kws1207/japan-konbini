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

- **Google Maps API는 `index.html:45`의 `<script>` 태그로 전역 로드된다.** 앱은 `google.maps.*` 전역을 직접 쓴다. `@react-google-maps/api`가 `package.json`에 있지만 실제로는 사용하지 않는다 — 로더로 감싸지 말고 지금 방식을 유지하거나, 바꿀 거면 의존성 제거까지 한 번에 하라.
- **API 키는 `index.html`에 하드코딩**되어 있고 `randomplacesjapan.netlify.app` 도메인 제한으로 보호된다. 로컬에서 404/Referer 에러가 나면 키가 아니라 도메인 제한 설정을 확인하라.
- **`mapAtom` (`src/atom.ts`)의 존재 이유**: `StreetView`가 생성한 `google.maps.Map` 인스턴스를 `useRandomPlace`의 `PlacesService` 생성자에 넘기기 위함. 이 atom을 제거하려면 인스턴스 전달 경로를 먼저 설계하라.
- **Google Maps 스크립트 로딩이 비동기라 앱 마운트 시 `google` 전역이 없을 수 있다.** `StreetView.tsx`는 `requestIdleCallback` (+ Safari 폴리필 `src/util/requestIdleCallbackSafari.js`) 로 초기화를 미룬다. 이 순서 의존성을 깨지 말 것.

## 도메인 상수

- `src/asset/japan.json` — 47개 도도부현 `FeatureCollection`. 이름 키는 `properties.nam` (예: `"Tokyo"`).
- `PlaceType = "convenience_store" | "train_station" | "starbucks"`. 스타벅스만 `textSearch(query: "Starbucks Coffee")`, 나머지는 `nearbySearch(type)` 로 분기.
- 검색 반경 시퀀스: `[50, 500, 5000]` (m). 3회 재시도 후 좌표 재생성.
- `index === -1` 은 "전국 무작위" 를 의미한다.

## 현존 기술부채 (건드릴 때 주의)

- `useRandomPlace.ts:52` — GeoJSON feature 접근에 `@ts-ignore`. 47개 prefecture인데 `Math.floor(Math.random() * 46)` 로 index 한 개가 빠지는 버그 존재.
- `App.tsx:6` — `jpGeoJson as any`. 타입 캐스팅 정리 대상.
- `useRandomPlace.ts` 전반에 `baseLoaction` 오타. 리네임 시 전수 치환.
- `StreetView.tsx:63` — `setIsLoading(false)` 가 `setPosition` 직후 동기적으로 실행되어 즉시 false로 돌아간다 (로딩 UI가 동작하지 않음).
- `StreetView.tsx:48` — `onIdle`이 `location`이 undefined인 상태로 `new StreetViewPanorama(...)` 를 호출할 수 있다.
- `useEffect` deps에 `JSON.stringify(location)` 을 쓰는 패턴이 몇 군데 있다 — 정규 dep으로 정리 가능하면 그쪽을 택하라.
