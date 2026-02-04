-- ============================================
-- ipo_news 테이블 확장 (PRD 요구사항 반영)
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 기존 테이블에 추가 컬럼 추가 (PRD 요구사항)
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS stock_name TEXT;
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS confirmed_price TEXT; -- 확정공모가
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS expected_price TEXT; -- 희망가액
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS subscription_date TEXT; -- 청약일
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS refund_date TEXT; -- 환불일
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS listing_date TEXT; -- 상장일
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS underwriter TEXT; -- 주관사
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS institutional_competition_ratio TEXT; -- 기관 경쟁률
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS lockup_ratio TEXT; -- 의무보유확약비율
ALTER TABLE ipo_news ADD COLUMN IF NOT EXISTS urgency_level TEXT; -- 긴급도 (high, medium, low)

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ipo_news_stock_name ON ipo_news(stock_name);
CREATE INDEX IF NOT EXISTS idx_ipo_news_subscription_date ON ipo_news(subscription_date);
CREATE INDEX IF NOT EXISTS idx_ipo_news_listing_date ON ipo_news(listing_date);
CREATE INDEX IF NOT EXISTS idx_ipo_news_urgency_level ON ipo_news(urgency_level);

-- 테이블 구조 확인
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ipo_news';

