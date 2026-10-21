# OeV Web

React 19 + TypeScript + Vite로 만든 투자 보조 서비스의 UI MVP입니다.
국내 주식 시세·차트, AI 확률 및 신호 이력은 샘플 데이터입니다. 코인 화면은 업비트 시세를 20초마다 조회합니다.

## 실행

```sh
npm install
npm run dev
```

## 코드 구조

- `src/App.tsx`: 공통 레이아웃 및 Outlet 상태 제공
- `src/components/layout/`: 상단 탐색 메뉴, 페이지 제목, 푸터
- `src/components/market/`: 검색 가능한 종목 목록, 가격 차트, AI 판단, 종목 테이블 및 행
- `src/components/ui/`: 공용 아이콘, 토스트
- `src/pages/`: 마켓, 관심 종목·신호 이력, 모의투자, 404 화면
- `src/hooks/useDashboard.ts`: 선택 종목, 관심 목록, 검색·필터 상태
- `src/types/market.ts`: 종목, 페이지, 차트 기간, 필터 타입
- `src/data/markets.ts`: UI 시연용 종목 데이터
- `src/utils/format.ts`: 숫자 표시 함수
- `src/styles/`: 디자인 토큰, 레이아웃, 대시보드, 반응형 스타일

## 디자인 기준

현재 화면은 사용자가 제공한 토스증권 스크린샷을 참고합니다.
밝은 배경, 시장 요약, 종목 정렬 표, 선택 종목 차트, 오른쪽 관심 목록을 구성했습니다.
상승은 빨강, 하락은 파랑으로 표시하며 AI 판단은 선택 종목 상세에 배치합니다.
`DESIGN.md`는 이전 Notion 자료로 보존했고 현재 스타일은 `src/styles/toss.css`,
공통 색상은 `src/styles/tokens.css`에서 관리합니다.
차트와 확률은 모두 UI 시연용 샘플 데이터입니다.

## 폰트

`pretendard` 패키지의 Pretendard Variable을 앱과 함께 번들링합니다.
외부 CDN 요청 없이 로드되며 패키지에 SIL OFL 라이선스가 포함되어 있습니다.
전체 화면은 한 폰트로 통일하고 가격·확률·시각에는 `tabular-nums`를 사용합니다.
타이포그래피 기준은 `src/styles/typography.css`에서 관리합니다.

## 확인 및 포맷

```sh
npm run build
npm run lint
npm run format
npm run format:check
```

관심 목록은 현재 메모리에서 관리하며 새로고침하면 초기화됩니다.
API 명세 확정 후 샘플 데이터 공급 부분을 실제 API로 연결할 예정입니다.

## 라우팅

`react-router-dom`의 BrowserRouter, Routes, Outlet, NavLink를 사용합니다.

| URL | 화면 |
| --- | --- |
| `/` | 마켓 |
| `/watchlist` | 관심 종목 |
| `/signals` | 신호 이력 |
| `/portfolio` | 모의투자 |
| `/crypto` | 코인 시세 |
| `/login`, `/signup` | 로그인·회원가입 |
| 그 외 | 404 |

경로 정의는 `src/routes/paths.ts`, 라우트 구성은 `src/App.tsx`에 있습니다.
공통 상태는 AppLayout에 유지하고 자식 페이지는 `useDashboardContext`로 접근합니다.
실제 배포 서버에서는 하위 경로 요청을 `index.html`로 보내는 SPA fallback 설정이 필요합니다.

## 변수 이름 규칙

- `selectedStock`: 선택한 종목
- `searchQuery`: 검색어
- `chartPeriod`: 차트 조회 기간
- `favoriteSymbols`: 관심 종목 종목코드 목록
- `signalFilter`: AI 신호 필터
- `filteredStocks`: 검색과 필터를 통과한 종목
- `buyProbability`: 매수 확률(%)
- `priceChangePercent`: 가격 등락률(%)
- `hoveredCandle`: 커서나 방향키로 선택한 캔들과 툴팁 위치

샘플 데이터는 `src/data`, 숫자 표시 함수는 `src/utils`, 공통 상태는 `src/hooks`에서 관리합니다.

## 대상 시장

MVP는 국내 주식(코스피·코스닥)을 대상으로 합니다. 종목코드와 시장 구분을 사용하며, 표시 가격과 AI 확률은 실제 시세가 아닌 UI 예시입니다.

## 신호 이력과 모의투자

- 신호 이력은 종목·기간·신호와 검색어로 조회하는 최신순 샘플 이력입니다.
- 모의투자는 가상 자금 1,000만 원으로 시작하며 샘플 현재가로 즉시 체결됩니다.
- 매수·매도, 보유 종목·평가손익·수익률, 체결 내역 및 확인 후 계좌 초기화를 지원합니다.
- 잔고와 보유 수량을 초과한 주문 및 양의 정수가 아닌 수량을 차단합니다.
- 모의 계좌는 sessionStorage에 저장됩니다. 로그인 사용자별 서버 계좌가 아니며 탭을 닫으면 사라집니다.
- 수수료·실시간 가격 변동은 반영하지 않습니다. 신호 이력·모의 주문 서버 API는 아직 연동하지 않았습니다.

## 인증과 코인 시세

- 인증 요청은 `VITE_API_BASE_URL`(기본 `/api`)을 사용합니다. `.env.example`과 개발 프록시는 `vite.config.ts`를 참고하세요.
- 코인 시세는 개발 서버의 `/upbit` 프록시를 사용합니다. 배포 환경에는 같은 프록시 또는 서버 API 연결이 필요합니다.
