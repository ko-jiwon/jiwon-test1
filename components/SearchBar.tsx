'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { StockName } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockName[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 1) {
        try {
          const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('자동완성 오류:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      onSearch(query.trim() || '주식');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: StockName) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    onSearch(suggestion.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none z-10">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="주식 뉴스 검색 (예: 삼성전자, 2월 증시, 반도체)"
          className="w-full pl-14 pr-36 py-4 text-base bg-white border-2 border-gray-100 rounded-2xl focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[#3182F6] text-white rounded-xl hover:bg-[#2563EB] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-sm shadow-sm hover:shadow-md z-10"
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

        {/* 자동완성 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-[#3182F6]/10' : ''
                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{suggestion.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

