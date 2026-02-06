export interface IPONews {
  id?: string;
  title: string;
  summary: string;
  schedule?: string;
  link: string;
  url?: string; // link와 동일한 용도
  created_at?: string;
  publishedAt?: string; // 발행일 (크롤링된 뉴스용)
  keywords?: string;
  source?: string; // 출처 (네이버 뉴스, Google News 등)
  snippet?: string; // summary와 동일한 용도
  // PRD 요구사항: 상세 IPO 정보
  stock_name?: string; // 종목명
  confirmed_price?: string; // 확정공모가
  expected_price?: string; // 희망가액
  subscription_date?: string; // 청약일
  refund_date?: string; // 환불일
  listing_date?: string; // 상장일
  underwriter?: string; // 주관사
  institutional_competition_ratio?: string; // 기관 경쟁률
  lockup_ratio?: string; // 의무보유확약비율
  urgency_level?: 'high' | 'medium' | 'low'; // 긴급도 (청약중, 오늘상장 등)
}

export interface NewsArticle {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: string;
}

export interface GeminiSummary {
  stock_name: string;
  schedule: string;
  summary: string;
  keywords?: string;
  // 확장된 정보
  confirmed_price?: string;
  expected_price?: string;
  subscription_date?: string;
  refund_date?: string;
  listing_date?: string;
  underwriter?: string;
  institutional_competition_ratio?: string;
  lockup_ratio?: string;
}

export interface StockName {
  name: string;
  count: number;
}
