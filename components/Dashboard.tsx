'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, Calendar, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { IPONews } from '@/types';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';

export default function Dashboard() {
  const [articles, setArticles] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // 초기 로딩: 데이터 가져오기 및 연결 상태 확인
    const initializeData = async () => {
      setInitialLoading(true);
      setError(null);
      setConnectionError(null);

      try {
        // 1. 먼저 기존 데이터 가져오기
        await fetchArticles();

        // 2. 데이터가 없으면 자동으로 크롤링 시도
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        if (!data.articles || data.articles.length === 0) {
          console.log('기존 데이터가 없어 자동 크롤링을 시작합니다...');
          // 자동 크롤링 트리거
          await handleSearch('2월 공모주');
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
      const response = await fetch('/api/articles');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.articles) {
        setArticles(data.articles);
        console.log(`✅ ${data.articles.length}개의 기사를 불러왔습니다.`);
      } else {
        setArticles([]);
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
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    setConnectionError(null);
    setSuccessMessage(null);

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

      // 성공 메시지 표시
      if (data.message) {
        setSuccessMessage(`${data.message} (${data.savedCount}개 저장됨)`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      // 저장된 기사가 있으면 목록 새로고침
      if (data.savedCount > 0) {
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#3182F6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">공모주 정보</h1>
              <p className="text-sm text-gray-500">AI로 요약한 최신 공모주 뉴스</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Error Message */}
        {connectionError && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-800 font-medium mb-1">데이터베이스 연결 오류</p>
                <p className="text-orange-700 text-sm">{connectionError}</p>
                <p className="text-orange-600 text-xs mt-2">
                  Vercel 대시보드에서 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)를 확인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} loading={loading || initialLoading} />
        </div>

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
              {initialLoading ? '데이터를 불러오는 중...' : '뉴스를 검색하고 요약하는 중...'}
            </p>
          </div>
        )}

        {/* Stats */}
        {articles.length > 0 && !loading && !initialLoading && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#3182F6]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#3182F6]" />
                </div>
                <span className="text-sm text-gray-500 font-medium">총 기사</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{articles.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-500 font-medium">고유 종목</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(articles.map((a) => a.title)).size}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500 font-medium">최근 업데이트</span>
              </div>
              <p className="text-sm text-gray-700 font-semibold">
                {articles[0]?.created_at
                  ? new Date(articles[0].created_at).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {articles.length > 0 && !loading && !initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id || article.link} article={article} />
            ))}
          </div>
        ) : (
          !loading && !initialLoading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                공모주 뉴스를 검색해보세요
              </h3>
              <p className="text-sm text-gray-500">
                검색어를 입력하면 최신 공모주 정보를 수집하고 요약해드립니다
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
