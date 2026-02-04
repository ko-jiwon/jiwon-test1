-- ============================================
-- posts 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 공모주 뉴스 테이블 생성
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

-- 테이블 생성 확인 (선택사항)
-- SELECT * FROM posts LIMIT 1;

