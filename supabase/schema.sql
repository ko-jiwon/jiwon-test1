-- 공모주 기사 테이블 생성
CREATE TABLE IF NOT EXISTS ipo_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_name TEXT NOT NULL,
  schedule TEXT,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ipo_articles_stock_name ON ipo_articles(stock_name);
CREATE INDEX IF NOT EXISTS idx_ipo_articles_created_at ON ipo_articles(created_at DESC);

-- 중복 방지를 위한 유니크 제약 조건 (같은 URL은 한 번만 저장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_articles_source_url ON ipo_articles(source_url);

