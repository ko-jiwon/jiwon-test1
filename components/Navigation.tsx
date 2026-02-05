'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export default function Navigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  // URL 쿼리 파라미터에서 검색어 가져오기
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchQuery(decodeURIComponent(queryParam));
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      // URL 쿼리 파라미터 업데이트 (페이지 새로고침 없이)
      router.push(`/?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-30 my-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-[40px]">
          {/* 왼쪽 로고 */}
          <Link href="/" className={`${playfair.className} text-[28px] font-bold text-gray-900 hover:text-[#3182F6] transition-colors`}>
            Stock News
          </Link>
          
          {/* 오른쪽 검색바 */}
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="주식 뉴스 검색 (예: 삼성전자, 2월 증시, 반도체)"
          className="w-[400px] px-4 py-2 border border-gray-300 rounded-[6px] text-[14px] placeholder:text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-black text-white rounded-[6px] font-medium hover:bg-gray-800 transition-colors"
        >
          검색
        </button>
      </form>
        </div>
      </div>
    </header>
  );
}

