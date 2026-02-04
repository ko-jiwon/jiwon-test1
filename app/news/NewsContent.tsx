'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, Loader2, Building2, ArrowUpDown, Clock, TrendingUp } from 'lucide-react';
import { IPONews } from '@/types';
import ArticleCard from '@/components/ArticleCard';
import SearchBar from '@/components/SearchBar';

export default function NewsContent() {
  const searchParams = useSearchParams();
  const stockQuery = searchParams.get('stock');
  
  const [articles, setArticles] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'relevance'>('latest');

  useEffect(() => {
    fetchArticles();
  }, [stockQuery, sortBy]);

  const fetchArticles = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/articles?sort=${sortBy}&limit=50`);
      const data = await response.json();
      
      if (data.articles) {
        let filteredArticles = [...data.articles];
        
        // 종목별 필터링
        if (stockQuery) {
          filteredArticles = filteredArticles.filter(article =>
            article.title.toLowerCase().includes(stockQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(stockQuery.toLowerCase()) ||
            article.keywords?.toLowerCase().includes(stockQuery.toLowerCase())
          );
        }
        
        // 정렬 로직
        if (sortBy === 'latest') {
          // 최신순
          filteredArticles.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
        } else if (sortBy === 'relevance') {
          // 관련도순: schedule이 있는 항목 우선, 그 다음 최신순
          filteredArticles.sort((a, b) => {
            const aHasSchedule = a.schedule && a.schedule !== '정보 없음' ? 1 : 0;
            const bHasSchedule = b.schedule && b.schedule !== '정보 없음' ? 1 : 0;
            
            if (aHasSchedule !== bHasSchedule) {
              return bHasSchedule - aHasSchedule;
            }
            
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
        }
        
        setArticles(filteredArticles);
      }
    } catch (err) {
      console.error('뉴스 불러오기 오류:', err);
      setError('뉴스를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setInitialLoading(false);
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

      if (data.savedCount > 0 || data.totalCrawled > 0) {
        await fetchArticles();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">News Center</h1>
          <p className="text-sm text-gray-500">공모주 관련 뉴스를 검색하고 확인하세요</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <SearchBar onSearch={handleSearch} loading={loading || initialLoading} />
        </div>

        {/* Stock Filter & Sort */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          {stockQuery && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                <span className="font-medium">{stockQuery}</span> 관련 뉴스
              </span>
            </div>
          )}
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'relevance')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6] bg-white"
            >
              <option value="latest">최신순</option>
              <option value="relevance">관련도순</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {(loading || initialLoading) && (
          <div className="flex flex-col justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">뉴스를 불러오는 중...</p>
          </div>
        )}

        {/* News List */}
        {articles.length > 0 && !loading && !initialLoading ? (
          <div className="space-y-4">
            {articles.map((article, index) => (
              <ArticleCard key={article.id || article.link || index} article={article} />
            ))}
          </div>
        ) : (
          !loading && !initialLoading && (
            <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
              <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {stockQuery ? `${stockQuery} 관련 뉴스가 없습니다` : '뉴스가 없습니다'}
              </h3>
              <p className="text-sm text-gray-500">
                검색어를 입력하여 뉴스를 검색해보세요
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

