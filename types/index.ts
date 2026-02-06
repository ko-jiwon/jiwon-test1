export interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  link: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  created_at?: string;
  keywords?: string;
  schedule?: string;
}

// 호환성을 위해 IPONews도 유지
export interface IPONews extends NewsItem {}
