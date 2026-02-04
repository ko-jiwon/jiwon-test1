export interface IPONews {
  id?: string;
  title: string;
  summary: string;
  schedule?: string;
  link: string;
  created_at?: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface GeminiSummary {
  stock_name: string;
  schedule: string;
  summary: string;
}

