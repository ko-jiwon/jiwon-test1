'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, TrendingUp, Calendar, FileText, Sparkles, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { IPONews } from '@/types';
import ArticleCard from './ArticleCard';

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('주식');
  const lastSearchRef = useRef<string>('주식');

  // 타임아웃이 있는 fetch 헬퍼 함수 (캐시 무시)
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        cache: 'no-store', // 캐시 무시
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`요청 타임아웃 (${timeout}ms 초과)`);
      }
      throw error;
    }
  };

  // 뉴스 크롤링 함수 (빠른 API 사용)
  const loadNewsFromCrawl = async (): Promise<boolean> => {
    try {
      console.log('[Dashboard] 빠른 뉴스 크롤링 시작');
      
      // 타임아웃 10초로 설정, 항상 최신 데이터 가져오기
      const response = await fetchWithTimeout('/api/news?q=주식', {}, 10000);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[Dashboard] HTTP 오류: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Dashboard] API 응답:', { 
        hasArticles: !!data.articles, 
        articleCount: data.articles?.length || 0,
        hasError: !!data.error,
      });
      
      if (data.error) {
        console.error('[Dashboard] API 에러:', data.error);
        throw new Error(data.error);
      }
      
      if (data.articles && data.articles.length > 0) {
        // 크롤링된 뉴스를 임시로 표시 (DB 저장은 백그라운드에서)
        const newsArticles: IPONews[] = (data.articles || data.data || []).map((article: any) => ({
          title: article.title || '제목 없음',
          summary: article.summary || article.snippet || '',
          link: article.link || article.url || '',
          source: article.source || '뉴스',
          publishedAt: article.publishedAt || '최근',
          created_at: new Date().toISOString(),
        }));
        
        setArticles(newsArticles);
        console.log(`✅ ${newsArticles.length}개의 뉴스를 크롤링했습니다.`);
        
        // 30개 미만이면 경고
        if (newsArticles.length < 30) {
          console.warn(`⚠️ 경고: ${newsArticles.length}개만 수집됨 (목표: 30개)`);
        } else {
          console.log(`✅ 목표 달성: 30개 뉴스 수집 완료`);
        }
        
        return true;
      } else {
        console.warn('[Dashboard] 크롤링된 뉴스가 없습니다.');
        return false;
      }
    } catch (err) {
      console.error('[Dashboard] 뉴스 크롤링 오류:', err);
      if (err instanceof Error) {
        console.error('[Dashboard] 오류 상세:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      }
      throw err;
    }
  };


  // 검색어로 뉴스 크롤링하는 함수
  const searchNews = async (query: string) => {
    setLoading(true);
    setInitialLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSearchQuery(query);
    
    try {
      console.log(`[Dashboard] 검색 시작: "${query}"`);
      
      // 검색어로 뉴스 크롤링 (항상 최신 데이터)
      const response = await fetchWithTimeout(`/api/news?q=${encodeURIComponent(query)}`, {}, 15000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error && !data.articles) {
        throw new Error(data.error);
      }
      
      if (data.articles && data.articles.length > 0) {
        const newsArticles: IPONews[] = (data.articles || data.data || []).map((article: any) => ({
          title: article.title || '제목 없음',
          summary: article.summary || article.snippet || '',
          link: article.link || article.url || '',
          source: article.source || '뉴스',
          publishedAt: article.publishedAt || '최근',
          created_at: new Date().toISOString(),
        }));
        
        setArticles(newsArticles);
        setSuccessMessage(`"${query}" 검색 결과 ${newsArticles.length}개의 뉴스를 찾았습니다.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log(`✅ ${newsArticles.length}개의 뉴스를 검색했습니다.`);
      } else {
        setArticles([]);
        setError(`"${query}"에 대한 뉴스를 찾을 수 없습니다.`);
      }
    } catch (err) {
      console.error('[Dashboard] 검색 오류:', err);
      const errorMsg = err instanceof Error ? err.message : '뉴스 검색 중 오류가 발생했습니다.';
      setError(errorMsg);
      setArticles([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // URL 쿼리 파라미터 변경 감지하여 검색 실행
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const searchTerm = queryParam ? decodeURIComponent(queryParam) : '주식';
    
    // 이전 검색어와 다를 때만 검색 실행 (무한 루프 방지)
    if (searchTerm !== lastSearchRef.current) {
      console.log(`[Dashboard] 검색어 변경 감지: "${lastSearchRef.current}" -> "${searchTerm}"`);
      lastSearchRef.current = searchTerm;
      searchNews(searchTerm);
    }
  }, [searchParams]);
  
  // 초기 로딩 (마운트 시 한 번만)
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const searchTerm = queryParam ? decodeURIComponent(queryParam) : '주식';
    
    // 초기 로딩: 검색어로 뉴스 로드
    console.log(`[Dashboard] 초기 로딩: "${searchTerm}"`);
    lastSearchRef.current = searchTerm;
    searchNews(searchTerm);
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-[#3182F6]/10 border border-[#3182F6]/20 rounded-2xl text-[#3182F6] text-sm font-medium animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Loading State with Skeleton */}
        {(loading || initialLoading) && (
          <div className="space-y-4">
            <div className="flex flex-col justify-center items-center py-8 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#3182F6]/10 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-[#3182F6] animate-spin" />
              </div>
              <p className="text-gray-500 text-sm">
                      {initialLoading ? '주식 뉴스를 불러오는 중...' : '뉴스를 검색하는 중...'}
              </p>
            </div>
            {/* Skeleton UI */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* 최신 주식 뉴스 리스트 */}
        {!loading && !initialLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">주식 뉴스</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      // 빠른 뉴스 API 사용 (타임아웃 10초)
                      const response = await fetchWithTimeout(`/api/news?q=${encodeURIComponent(searchQuery)}`, {}, 10000);
                      
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      
                      const data = await response.json();
                      
                      if (data.error && !data.articles) {
                        throw new Error(data.error);
                      }
                      
                      if (data.articles && data.articles.length > 0) {
                        const newsArticles: IPONews[] = data.articles.map((article: any) => ({
                          title: article.title || '제목 없음',
                          summary: article.snippet || article.summary || '',
                          link: article.url || article.link || '',
                          source: article.source || '뉴스',
                          created_at: new Date().toISOString(),
                        }));
                        setArticles(newsArticles);
                        setSuccessMessage(`${newsArticles.length}개의 최신 뉴스를 불러왔습니다.`);
                        setTimeout(() => setSuccessMessage(null), 3000);
                      } else {
                        setError('뉴스를 찾을 수 없습니다.');
                      }
                    } catch (err) {
                      console.error('[Dashboard] 뉴스 새로고침 오류:', err);
                      const errorMsg = err instanceof Error ? err.message : '뉴스 새로고침 중 오류가 발생했습니다.';
                      setError(errorMsg.includes('타임아웃') ? '요청 시간이 초과되었습니다. 다시 시도해주세요.' : errorMsg);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="text-sm text-[#4b4b4b] hover:text-[#333333] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  뉴스 새로고침
                </button>
              </div>
            </div>

            {articles.length > 0 ? (
              <div className="space-y-[10px]">
                {articles.map((article, index) => (
                  <ArticleCard key={article.id || article.link || `article-${index}`} article={article} />
                ))}
              </div>
            ) : !initialLoading && !loading ? (
              <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  뉴스가 없습니다
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  주식 관련 뉴스를 찾을 수 없습니다.
                </p>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await loadNewsFromCrawl();
                    } catch (err) {
                      setError('뉴스 크롤링 중 오류가 발생했습니다.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#3182F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors text-sm font-medium"
                >
                  다시 시도
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
