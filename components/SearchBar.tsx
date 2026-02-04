'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      onSearch(query.trim() || '공모주');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="공모주 뉴스 검색 (예: 2월 공모주, IPO, 신규 상장)"
          className="w-full pl-14 pr-36 py-4 text-base bg-white border-2 border-gray-100 rounded-2xl focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[#3182F6] text-white rounded-xl hover:bg-[#2563EB] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-sm shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>검색 중</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>검색</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

