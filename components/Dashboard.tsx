'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Newspaper, Calendar, TrendingUp } from 'lucide-react';
import { IPONews } from '@/types';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';

export default function Dashboard() {
  const [articles, setArticles] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error('기사 불러오기 오류:', err);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

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
        throw new Error(data.error || '크롤링 중 오류가 발생했습니다.');
      }

      // 성공 메시지 표시 및 기사 목록 새로고침
      if (data.savedCount > 0) {
        // 저장된 기사가 있으면 목록 새로고침
        await fetchArticles();
      }
      
      // 성공 메시지를 잠시 표시
      if (data.message) {
        console.log(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              공모주 정보 요약 서비스
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            최신 공모주 뉴스를 검색하고 AI로 요약된 정보를 확인하세요
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">뉴스를 검색하고 요약하는 중...</span>
          </div>
        )}

        {/* Stats */}
        {articles.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">총 기사 수</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{articles.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">고유 종목 수</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {new Set(articles.map((a) => a.title)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">최근 업데이트</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {articles[0]?.created_at
                  ? new Date(articles[0].created_at).toLocaleDateString('ko-KR')
                  : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id || article.link} article={article} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                검색어를 입력하여 공모주 뉴스를 검색해보세요
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

