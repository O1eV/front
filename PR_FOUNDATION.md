## 개요

- 큰 공통 UI 작업에서 실행 환경과 디자인 토큰만 분리한 첫 PR입니다.
- 대상: `feature/ui-foundation` → `dev`

## 주요 변경 사항 (Key Changes)

- [x] React + TypeScript + Vite 실행 환경 구성
- [x] ESLint / Prettier 설정 및 실행 스크립트 추가
- [x] Pretendard와 공통 색상·간격·서체 토큰 추가
- [x] 로고·파비콘과 기본 화면 구성
- [x] README와 AGENTS.md 실행 명령 갱신

## 스크린샷 / 시연 영상

- 기본 화면만 포함합니다. 종목·차트·AI 화면은 후속 PR로 분리합니다.

## 리뷰어에게 전달할 말

- 수동 작성 변경: 338줄(+335/-3)
- 자동 생성 package-lock.json: 2,873줄. 재현 가능한 설치를 위해 포함했습니다.
- 실행 환경과 디자인 토큰을 중심으로 검토해 주세요.
- `npm run build`, `npm run lint`, `npm run format:check` 통과했습니다.
- 전체 구현은 기존 `feature/common-ui` 브랜치에 보존되어 있습니다.
