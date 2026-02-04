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

  useEffect(() => {
    // 초기 로딩: 공모주 뉴스 자동 크롤링 및 표시
    // 성능 최적화: 병렬 로딩 및 캐싱 활용
    const initializeData = async () => {
      setInitialLoading(true);
      setError(null);
      setConnectionError(null);

      try {
        // 병렬로 데이터 페칭 (성능 향상)
        const [articlesResponse] = await Promise.all([
          fetch('/api/articles?sort=latest&limit=10', {
            // 캐시 활용 (최대 30초)
            cache: 'no-store', // 실시간 데이터 필요
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ]);
        
        const data = await articlesResponse.json();
        
        if (data.articles && data.articles.length > 0) {
          // 기존 데이터가 있으면 최신순으로 정렬하여 표시 (최대 10개)
          const sortedArticles = [...data.articles]
            .sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA; // 최신순
            })
            .slice(0, 10); // 최대 10개만
          setArticles(sortedArticles);
          
          // 일정이 있는 기사만 필터링하여 오늘/이번 주 일정 추출
          // 긴급도가 높은 항목 우선 정렬
          const schedules = sortedArticles
            .filter(article => article.schedule && article.schedule !== '정보 없음')
            .sort((a, b) => {
              // 긴급도가 높은 항목 우선 (청약중, 오늘 상장 등)
              const aUrgent = a.schedule?.includes('청약중') || a.schedule?.includes('오늘') ? 1 : 0;
              const bUrgent = b.schedule?.includes('청약중') || b.schedule?.includes('오늘') ? 1 : 0;
              if (aUrgent !== bUrgent) return bUrgent - aUrgent;
              
              // 그 다음 최신순
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);
          setUpcomingSchedules(schedules);
          
          console.log(`✅ ${sortedArticles.length}개의 기존 기사를 불러왔습니다.`);
        } else {
          // 데이터가 없으면 자동으로 공모주 뉴스 크롤링 (백그라운드에서)
          console.log('기존 데이터가 없어 공모주 뉴스를 자동 크롤링합니다...');
          // 비동기로 크롤링 (로딩 블로킹 방지)
          handleSearch('공모주', false).catch(err => {
            console.error('자동 크롤링 오류:', err);
          });
        }
      } catch (err) {
        console.error('초기화 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
        
        // 연결 에러인지 확인
        if (errorMessage.includes('Supabase') || errorMessage.includes('연결')) {
          setConnectionError('데이터베이스 연결에 실패했습니다. 환경 변수를 확인해주세요.');
        } else {
          setError(errorMessage);
        }
      } finally {
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
      } else if (data.totalCrawled === 0) {
        setError('크롤링된 뉴스가 없습니다. 검색어를 변경해보세요.');
      }
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

        {/* Loading State */}
        {(loading || initialLoading) && (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#3182F6]/10 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-[#3182F6] animate-spin" />
            </div>
            <p className="text-gray-500 text-sm">
              {initialLoading ? '공모주 뉴스를 불러오는 중...' : '뉴스를 검색하고 요약하는 중...'}
            </p>
          </div>
        )}

        {/* 1.1 오늘/이번 주 주요 일정 요약 */}
        {!loading && !initialLoading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">오늘/이번 주 주요 일정</h2>
              <Link 
                href="/calendar" 
                className="text-sm text-[#3182F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
              >
                전체 일정 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingSchedules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSchedules.map((schedule, index) => {
                  // 긴급도 계산
                  const scheduleText = schedule.schedule || '';
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // 오늘 상장 체크
                  const isTodayListing = scheduleText.includes('상장') && 
                    (scheduleText.includes('오늘') || scheduleText.includes(today.toLocaleDateString('ko-KR')));
                  
                  // 청약중 체크
                  const isSubscriptionActive = scheduleText.includes('청약중') || scheduleText.includes('청약');
                  
                  // 긴급도 결정
                  const isUrgent = isTodayListing || isSubscriptionActive;
                  
                  // 날짜 파싱 시도
                  const dateMatch = scheduleText.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
                  let isToday = false;
                  if (dateMatch) {
                    const [, year, month, day] = dateMatch;
                    const scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    scheduleDate.setHours(0, 0, 0, 0);
                    isToday = scheduleDate.getTime() === today.getTime();
                  }
                  
                  const urgencyLevel = isTodayListing || (isToday && scheduleText.includes('상장')) ? 'high' :
                                     isSubscriptionActive ? 'high' : 'medium';
                  
                  const borderColor = urgencyLevel === 'high' 
                    ? 'border-red-300 border-2' 
                    : 'border-gray-100';
                  const bgColor = urgencyLevel === 'high' 
                    ? 'bg-red-50' 
                    : 'bg-emerald-50';
                  const iconColor = urgencyLevel === 'high' 
                    ? 'text-red-600' 
                    : 'text-emerald-600';
                  const scheduleColor = urgencyLevel === 'high' 
                    ? 'text-red-700 font-bold' 
                    : 'text-emerald-700 font-medium';
                  
                  return (
                    <div
                      key={schedule.id || schedule.link || index}
                      className={`bg-white rounded-xl p-4 border ${borderColor} hover:shadow-md transition-shadow ${urgencyLevel === 'high' ? 'ring-2 ring-red-200' : ''}`}
                    >
                      {urgencyLevel === 'high' && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md">
                            🔥 긴급
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Calendar className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                            {schedule.title}
                          </h3>
                          <p className={`text-xs ${scheduleColor} mb-2`}>
                            {schedule.schedule}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {schedule.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">예정된 일정이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 1.2 최신 공모주 뉴스 리스트 */}
        {!loading && !initialLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">최신 공모주 뉴스</h2>
              <Link 
                href="/news" 
                className="text-sm text-[#3182F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
              >
                전체 뉴스 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {articles.length > 0 ? (
              <div className="space-y-4">
                {articles.slice(0, 10).map((article, index) => (
                  <ArticleCard key={article.id || article.link || index} article={article} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  뉴스가 없습니다
                </h3>
                <p className="text-sm text-gray-500">
                  검색어를 입력하여 공모주 뉴스를 검색해보세요
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
