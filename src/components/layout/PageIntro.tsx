import type { Page } from "../../types/market";

export function PageIntro({ page }: { page: Page }) {
  const titles: Record<Page, string> = {
    대시보드: "마켓",
    "관심 종목": "관심 종목",
    "신호 이력": "신호 이력",
    "모의 포트폴리오": "모의투자",
  };

  return (
    <div className="page-heading">
      <div className="page-title">
        <h1>{titles[page]}</h1>
        {page === "대시보드" && <span>국내 주식</span>}
      </div>

      <span className="demo-status">
        <span /> 데모 데이터
      </span>
    </div>
  );
}
