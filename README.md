# OeV Frontend

React + TypeScript + Vite 기반 프론트엔드입니다.
이 PR은 실행 환경, 기본 화면, 로고, 디자인 토큰만 포함합니다.
종목·차트·AI 화면과 API 연동은 후속 작업입니다.

## 실행

```sh
npm ci
npm run dev
```

## 검증

```sh
npm run build
npm run lint
npm run format:check
```

## 구조

- `src/App.tsx`: 기본 화면
- `src/styles/tokens.css`: 공통 색상·서체·간격
- `public/favicon.svg`: 헤더·파비콘용 로고

Pretendard는 패키지에서 로컬 번들링합니다.

## 공용 UI 컴포넌트

- `src/components/ui/Icon.tsx`: 이름과 크기로 사용하는 SVG 아이콘. 장식용으로 스크린리더에서 숨깁니다.

```tsx
<Icon name="search" size={20} />
```

이 브랜치의 PR 기준 브랜치는 `feature/ui-foundation`입니다.
