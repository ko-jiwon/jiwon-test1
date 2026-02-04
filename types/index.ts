export interface IPONews {
  id?: string;
  title: string;
  summary: string;
  schedule?: string;
  link: string;
  created_at?: string;
  keywords?: string;
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
}
