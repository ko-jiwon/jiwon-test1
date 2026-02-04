-- ============================================
-- ipo_news 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 공모주 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS ipo_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  schedule TEXT,
  link TEXT NOT NULL,
  keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ipo_news_title ON ipo_news(title);
CREATE INDEX IF NOT EXISTS idx_ipo_news_created_at ON ipo_news(created_at DESC);

-- 중복 방지를 위한 유니크 제약 조건 (같은 링크는 한 번만 저장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_news_link ON ipo_news(link);

-- keywords 컬럼 추가 (이미 테이블이 있는 경우)
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS keywords TEXT;

-- 테이블 생성 확인 (선택사항)
-- SELECT * FROM ipo_news LIMIT 1;
