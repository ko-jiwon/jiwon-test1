-- ============================================
-- 옵션 1: ipo_news 테이블 생성 (추천)
-- ============================================

-- 공모주 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS ipo_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  schedule TEXT,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ipo_news_title ON ipo_news(title);
CREATE INDEX IF NOT EXISTS idx_ipo_news_created_at ON ipo_news(created_at DESC);

-- 중복 방지를 위한 유니크 제약 조건 (같은 링크는 한 번만 저장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_news_link ON ipo_news(link);

-- ============================================
-- 옵션 2: posts 테이블 생성
-- ============================================

-- 공모주 뉴스 테이블 생성 (posts 이름 사용)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  schedule TEXT,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 중복 방지를 위한 유니크 제약 조건 (같은 링크는 한 번만 저장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_link ON posts(link);

