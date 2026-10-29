# O1eV Web

React 19 + TypeScript + Vite로 만든 투자 보조 서비스의 UI MVP입니다.
현재 시세, 차트, AI 확률 및 신호 이력은 모두 샘플 데이터입니다.

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
| 그 외 | 404 |

경로 정의는 `src/routes/paths.ts`, 라우트 구성은 `src/routes/AppRoutes.tsx`에 있습니다.
공통 상태는 App에 유지하고 자식 페이지는 `useDashboardContext`로 접근합니다.
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


### 서버 시세 연결 및 브라우저 지원
코인 차트와 수집 시세는 `/api/markets` 계열 백엔드 API로 조회합니다.
업비트 직접 호출과 개발 전용 `/upbit` 프록시는 제거했습니다.
운영 웹 서버는 `/api`를 Spring Boot로 중계하거나 `VITE_API_BASE_URL`을 설정해야 합니다.
브라우저 연습 모드는 화면 안내대로 샘플 가격을 사용합니다.
`AbortSignal.any`와 `AbortSignal.timeout`을 지원하는 브라우저가 필요합니다.

실시간 인증 갱신에 실패하면 자동 재접속을 중단합니다. 다시 로그인하면 새 세션으로 연결합니다.

### 국내 주식 데모 (#60)

`/stocks?symbol=005930`에서 로그인 후 삼성전자 현재가와 최근 300개 1분봉을
조회합니다. 주 메뉴의 국내 주식 또는 검색창의 삼성전자/005930으로 진입할 수 있습니다.
서버의 `/api/demo/stocks/005930/price`와 `/candles?interval=1m&limit=300`을
10초 간격으로 폴링하며, 주식 화면에서는 AI 신호나 STOMP 구독을 사용하지 않습니다.
현재가가 없거나 오래된 경우 안내하며 저장된 차트는 독립적으로 표시합니다.

백엔드의 키움 수집 활성화 및 해당 종목 설정이 필요합니다. prod에서는 데모 API가
열리지 않습니다. CloudFront에서도 `/api/demo/stocks/*`가 백엔드로 전달되고
Authorization 헤더가 유지되어야 합니다. 수집 전 구간이나 장 마감에는 데이터가
없을 수 있습니다. 이 PR은 AWS 설정이나 배포를 변경하지 않습니다.
검증: `node scripts/test-demo-stocks.mjs`.

로컬 개발 프록시는 기본적으로 AWS CloudFront 백엔드를 사용합니다.
`VITE_API_BASE_URL=/api`, `VITE_WS_URL`은 비워 둔 채 개발 서버를 실행하세요.
`DEV_PROXY_TARGET=http://localhost:8080`으로 로컬 백엔드로 전환할 수 있습니다.
프록시는 Origin 검사를 우회하지 않습니다. AWS 서버가 로컬 Origin을 거부하면
서버의 허용 Origin에 `http://localhost:5173`을 추가해야 합니다.

### EC2용 프런트 nginx 이미지 (#59)

```bash
docker build -t ove-font:local .
# app과 같은 Docker 네트워크에서 실행합니다.
docker run --rm --network <compose-network> -p 8081:80 \
    -e BACKEND_HOST=app -e BACKEND_PORT=8080 ove-font:local
```

Node 22에서 Vite를 빌드하고 nginx가 정적 파일과 `/api`, `/ws`를 한 출처로
서빙합니다. 서버에 `.env`나 소스·node_modules를 넣지 않고 빌드 산출물만 복사합니다.
Docker 빌드는 API `/api`, WebSocket `/ws` 상대 경로를 사용합니다. Vite 환경변수는
빌드 시점에 정해지며 실행 시에는 `BACKEND_HOST`(기본 app), `BACKEND_PORT`(기본 8080)만
변경합니다. 백엔드 DNS가 존재하고 앱이 준비된 뒤 프런트를 시작하세요.
백엔드 컨테이너가 교체되어 IP가 바뀌면 nginx 컨테이너도 재시작하세요.

- `/stocks?symbol=005930` 같은 SPA 직접 접근은 index.html로 fallback합니다.
- `/api`·`/api/*`는 경로와 쿼리를 유지하며 백엔드의 401/404 등을 그대로 반환합니다.
- `/ws`·`/ws/*`는 HTTP/1.1 Upgrade/Connection과 75초 읽기 타임아웃을 사용합니다.
- `/healthz`는 nginx 자체 상태만 확인하며 백엔드 가용성을 의미하지 않습니다.
- 해시된 `/assets/*`는 장기 캐시, index.html은 재검증합니다. 없는 asset은 404입니다.

백엔드 `docker-compose.prod.yml`의 `FRONT_IMAGE`에 푸시한 이미지 태그를 넣으면
nginx 서비스가 이 이미지를 사용합니다. 이 PR은 이미지 빌드 구성만 추가하며 AWS/ECR에
실제 배포하거나 이미지를 업로드하지 않습니다. EC2가 amd64이면 ARM 맥에서
`docker buildx build --platform linux/amd64 -t <registry>/ove-font:<tag> --push .`처럼
대상 플랫폼을 명시해 별도로 빌드하세요.

CloudFront는 모든 경로를 같은 nginx origin으로 전달하고, `/api*`와 `/ws*`는 캐시를
비활성화해야 합니다. 필요한 메서드(GET/POST/DELETE 등), 쿼리, Cookie,
Authorization, Origin, WebSocket Upgrade 관련 헤더를 전달하세요.
CloudFront-Forwarded-Proto 또는 X-Forwarded-Proto가 전달되면 nginx는 이를 유지합니다.
백엔드는 전달 헤더를 처리하고 허용 Origin을 실제 CloudFront 도메인으로 설정해야 합니다.
이 nginx는 Origin·인증 헤더를 제거하거나 CORS 허용 범위를 변경하지 않습니다.
EC2 origin 직접 접근을 제한하고, CloudFront 설정 변경 후 로그인·refresh·로그아웃 및
STOMP 연결을 실제 HTTPS 주소에서 확인하세요.

참고: [nginx WebSocket 프록시](https://nginx.org/en/docs/http/websocket.html),
[공식 nginx 이미지 템플릿](https://hub.docker.com/_/nginx).

이미지 검증은 `docker build -t ove-font:issue-59-test .` 후
`python3 scripts/test-nginx-docker.py ove-font:issue-59-test`로 재현할 수 있습니다.
이 스크립트는 전용 네트워크·가짜 백엔드·임시 프런트 컨테이너를 만들고 종료 시 정리합니다.
AWS나 실제 가입 계정은 사용하지 않습니다. Docker와 Python 3가 필요합니다.
