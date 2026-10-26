export interface Stock {
  name: string;
  symbol: string;
  exchange: "KOSPI" | "KOSDAQ" | "UPBIT";
  icon: string;
  color: string;
  price: number;
  priceChangePercent: number;
  buyProbability: number;
}

export type Page = "대시보드" | "관심 종목" | "신호 이력" | "모의 포트폴리오";

export const PERIODS = ["1시간", "1일", "1주", "1개월", "1년"] as const;

export type ChartPeriod = (typeof PERIODS)[number];

export type MarketFilter = "전체" | "매수 신호";
