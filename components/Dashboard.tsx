'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Calendar, FileText, Sparkles, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { IPONews } from '@/types';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';
import Link from 'next/link';

export default function Dashboard() {
  const [articles, setArticles] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState<IPONews[]>([]);

  // 타임아웃이 있는 fetch 헬퍼 함수
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
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
      
      // 타임아웃 10초로 설정
      const response = await fetchWithTimeout('/api/news?q=공모주', {}, 10000);
      
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
        const newsArticles: IPONews[] = data.articles.map((article: any) => ({
          title: article.title || '제목 없음',
          summary: article.snippet || article.summary || '',
          link: article.url || article.link || '',
          source: article.source || '뉴스',
          created_at: new Date().toISOString(),
        }));
        
        setArticles(newsArticles);
        console.log(`✅ ${newsArticles.length}개의 뉴스를 크롤링했습니다.`);
        
        // 백그라운드에서 DB에 저장 (사용자 경험을 위해 비동기)
        saveToDatabaseInBackground();
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

  // 백그라운드에서 DB에 저장
  const saveToDatabaseInBackground = async () => {
    try {
      // 비동기로 실행 (사용자 경험을 위해 await 하지 않음)
      fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: '공모주' }),
      }).then(() => {
        console.log('[Dashboard] 백그라운드 DB 저장 완료');
      }).catch((err) => {
        console.error('[Dashboard] 백그라운드 DB 저장 오류:', err);
      });
    } catch (err) {
      console.error('[Dashboard] 백그라운드 DB 저장 오류:', err);
    }
  };

  // 백그라운드에서 뉴스 새로고침
  const refreshNewsInBackground = async () => {
    try {
      const response = await fetchWithTimeout('/api/news?q=공모주&refresh=true', {}, 10000);
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          const newsArticles: IPONews[] = data.articles.map((article: any) => ({
            title: article.title || '제목 없음',
            summary: article.snippet || article.summary || '',
            link: article.url || article.link || '',
            source: article.source || '뉴스',
            created_at: new Date().toISOString(),
          }));
          setArticles(newsArticles);
          console.log('[Dashboard] 백그라운드 새로고침 완료');
        }
      }
    } catch (err) {
      console.error('[Dashboard] 백그라운드 새로고침 오류:', err);
      // 백그라운드 오류는 조용히 처리
    }
  };

  useEffect(() => {
    // 초기 로딩: 공모주 뉴스 자동 크롤링 및 표시
    const initializeData = async () => {
      setInitialLoading(true);
      setError(null);
      setConnectionError(null);
      
      let isCompleted = false;
      
      // 타임아웃 감지 (15초 후 강제 종료)
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.error('[Dashboard] 초기화 타임아웃 (15초 초과)');
          setInitialLoading(false);
          setError('뉴스를 불러오는데 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
          isCompleted = true;
        }
      }, 15000);

      try {
        // 1. 먼저 빠른 뉴스 API로 크롤링 (캐시 활용, 타임아웃 10초)
        console.log('[Dashboard] 초기 뉴스 로딩 시작');
        try {
          const newsResponse = await fetchWithTimeout('/api/news?q=공모주', {}, 10000);
          
          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            console.log('[Dashboard] 뉴스 API 응답:', { 
              articleCount: newsData.articles?.length || 0,
              cached: newsData.cached,
            });
            
            if (newsData.articles && newsData.articles.length > 0) {
              // 크롤링된 뉴스 즉시 표시
              const newsArticles: IPONews[] = newsData.articles.map((article: any) => ({
                title: article.title || '제목 없음',
                summary: article.snippet || article.summary || '',
                link: article.url || article.link || '',
                source: article.source || '뉴스',
                created_at: new Date().toISOString(),
              }));
              
              setArticles(newsArticles);
              setUpcomingSchedules([]);
              console.log(`✅ ${newsArticles.length}개의 뉴스를 불러왔습니다. (캐시: ${newsData.cached ? '예' : '아니오'})`);
              isCompleted = true;
              clearTimeout(timeoutId);
              setInitialLoading(false);
              
              // 백그라운드에서 DB에 저장
              saveToDatabaseInBackground();
              return;
            }
          } else {
            console.warn(`[Dashboard] 뉴스 API 실패: ${newsResponse.status}`);
          }
        } catch (newsErr) {
          console.error('[Dashboard] 뉴스 API 오류:', newsErr);
          // 계속 진행 (다음 단계 시도)
        }
        
        // 2. 뉴스 API 실패 시 DB에서 확인 (타임아웃 5초)
        try {
          console.log('[Dashboard] DB에서 기존 데이터 확인');
          const dbResponse = await fetchWithTimeout('/api/articles?sort=latest&limit=10', {
            cache: 'no-store',
          }, 5000);
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            
            if (dbData.articles && dbData.articles.length > 0) {
              const sortedArticles = [...dbData.articles]
                .sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 10);
              setArticles(sortedArticles);
              setUpcomingSchedules([]);
              console.log(`✅ ${sortedArticles.length}개의 기존 기사를 불러왔습니다.`);
              isCompleted = true;
              clearTimeout(timeoutId);
              setInitialLoading(false);
              
              // 백그라운드에서 최신 뉴스 크롤링
              refreshNewsInBackground();
              return;
            }
          }
        } catch (dbErr) {
          console.error('[Dashboard] DB 조회 오류:', dbErr);
          // 계속 진행
        }
        
        // 3. 둘 다 실패하면 직접 크롤링 시도 (타임아웃 10초)
        console.log('[Dashboard] 직접 크롤링 시도');
        try {
          const success = await loadNewsFromCrawl();
          if (success) {
            isCompleted = true;
            clearTimeout(timeoutId);
            setInitialLoading(false);
            return;
          }
        } catch (crawlErr) {
          console.error('[Dashboard] 직접 크롤링 실패:', crawlErr);
          // 계속 진행 (폴백 처리)
        }
        
        // 4. 모든 시도 실패 - 빈 상태 표시
        console.warn('[Dashboard] 모든 데이터 소스 실패');
        isCompleted = true;
        clearTimeout(timeoutId);
        setArticles([]);
        setUpcomingSchedules([]);
        setError('뉴스를 불러오는데 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
        setInitialLoading(false);
        
      } catch (err) {
        console.error('[Dashboard] 초기화 오류:', err);
        isCompleted = true;
        clearTimeout(timeoutId);
        
        const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
        
        if (errorMessage.includes('Supabase') || errorMessage.includes('연결')) {
          setConnectionError('데이터베이스 연결에 실패했습니다. 환경 변수를 확인해주세요.');
        } else if (errorMessage.includes('타임아웃')) {
          setError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
        } else {
          setError(errorMessage);
        }
        setArticles([]);
        setInitialLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchArticles = async () => {
    try {
      setError(null);
      // 성능 최적화: limit 파라미터 추가
      const response = await fetch('/api/articles?sort=latest&limit=10', {
        // 캐시 활용
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.articles) {
        // 최신순으로 정렬하고 최대 10개만 표시
        const sortedArticles = [...data.articles]
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // 최신순 (내림차순)
          })
          .slice(0, 10); // 최대 10개만
        setArticles(sortedArticles);
        
        // 일정 추출
        const schedules = sortedArticles
          .filter(article => article.schedule && article.schedule !== '정보 없음')
          .slice(0, 5);
        setUpcomingSchedules(schedules);
        
        console.log(`✅ ${sortedArticles.length}개의 기사를 불러왔습니다.`);
      } else {
        setArticles([]);
        setUpcomingSchedules([]);
        console.log('⚠️ 불러온 데이터가 없습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기사를 불러오는 중 오류가 발생했습니다.';
      console.error('기사 불러오기 오류:', err);
      
      // 연결 에러 구분
      if (errorMessage.includes('Supabase') || errorMessage.includes('연결') || errorMessage.includes('환경 변수')) {
        setConnectionError('데이터베이스 연결에 실패했습니다. Vercel 환경 변수를 확인해주세요.');
      } else {
        setError(errorMessage);
      }
      
      setArticles([]);
      setUpcomingSchedules([]);
    }
  };

  const handleSearch = async (searchQuery: string, showSuccessMessage: boolean = true) => {
    setLoading(true);
    setError(null);
    setConnectionError(null);
    if (showSuccessMessage) {
      setSuccessMessage(null);
    }

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 상세한 에러 메시지 표시
        const errorMsg = data.error || data.details || '크롤링 중 오류가 발생했습니다.';
        throw new Error(errorMsg);
      }

      // 성공 메시지 표시 (showSuccessMessage가 true일 때만)
      if (showSuccessMessage && data.message) {
        setSuccessMessage(`${data.message} (${data.savedCount}개 저장됨)`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      // 저장된 기사가 있으면 목록 새로고침
      if (data.savedCount > 0 || data.totalCrawled > 0) {
        await fetchArticles();
      }
      // 크롤링된 뉴스가 없어도 에러 메시지 표시하지 않음
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('크롤링 오류:', err);
      
      // 연결 에러 구분
      if (errorMessage.includes('Supabase') || errorMessage.includes('환경 변수') || errorMessage.includes('연결')) {
        setConnectionError('데이터베이스 연결에 실패했습니다. Vercel 환경 변수를 확인해주세요.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 최상단 검색 필드 */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-sm text-gray-500">공모주 정보를 한눈에 확인하세요</p>
          </div>
          <SearchBar onSearch={(query) => handleSearch(query, true)} loading={loading || initialLoading} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Connection Error Message */}
        {connectionError && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-800 font-medium mb-1">데이터베이스 연결 오류</p>
                <p className="text-orange-700 text-sm">{connectionError}</p>
              </div>
            </div>
          </div>
        )}

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
                {initialLoading ? '공모주 뉴스를 불러오는 중...' : '뉴스를 검색하고 요약하는 중...'}
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

        {/* 최신 공모주 경제 뉴스 리스트 */}
        {!loading && !initialLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">공모주 뉴스</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      // 빠른 뉴스 API 사용 (타임아웃 10초)
                      const response = await fetchWithTimeout('/api/news?q=공모주&refresh=true', {}, 10000);
                      
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
                  className="text-sm text-[#3182F6] hover:text-[#2563EB] font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  뉴스 새로고침
                </button>
                <Link 
                  href="/news" 
                  className="text-sm text-[#3182F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
                >
                  전체 뉴스 보기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {articles.length > 0 ? (
              <div className="space-y-4">
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
                  공모주 관련 뉴스를 찾을 수 없습니다.
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
