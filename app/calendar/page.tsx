'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Filter, Building2, TrendingUp, Loader2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { IPONews } from '@/types';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [filter, setFilter] = useState<'all' | 'demand' | 'subscription' | 'listing'>('all');
  const [schedules, setSchedules] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/calendar?filter=${filter}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('일정 불러오기 오류:', err);
      setError(err instanceof Error ? err.message : '일정을 불러오는 중 오류가 발생했습니다.');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromSchedule = (schedule: string): { label: string; color: string; urgency: 'high' | 'medium' | 'low' } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 상장 체크
    const isTodayListing = schedule.includes('상장') && 
      (schedule.includes('오늘') || schedule.includes(today.toLocaleDateString('ko-KR')));
    
    // 날짜 파싱
    const dateMatch = schedule.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    let isToday = false;
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      scheduleDate.setHours(0, 0, 0, 0);
      isToday = scheduleDate.getTime() === today.getTime();
    }
    
    if (schedule.includes('청약') || schedule.includes('청약중')) {
      const urgency = schedule.includes('청약중') ? 'high' : 'medium';
      return { 
        label: '청약중', 
        color: urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700',
        urgency 
      };
    } else if (isTodayListing || (isToday && schedule.includes('상장'))) {
      return { 
        label: '오늘상장', 
        color: 'bg-red-50 text-red-700 border-red-200',
        urgency: 'high' 
      };
    } else if (schedule.includes('수요예측') || schedule.includes('수요')) {
      return { 
        label: '수요예측', 
        color: 'bg-blue-50 text-blue-700',
        urgency: 'medium' 
      };
    } else if (schedule.includes('상장') || schedule.includes('상장예정')) {
      return { 
        label: '상장예정', 
        color: 'bg-purple-50 text-purple-700',
        urgency: 'medium' 
      };
    }
    return { 
      label: '일정확인', 
      color: 'bg-gray-50 text-gray-700',
      urgency: 'low' 
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IPO Calendar</h1>
          <p className="text-sm text-gray-500">공모주 일정을 확인하고 관리하세요</p>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[#3182F6] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                달력 뷰
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#3182F6] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                리스트 뷰
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
              >
                <option value="all">전체</option>
                <option value="demand">수요예측</option>
                <option value="subscription">청약중</option>
                <option value="listing">상장예정</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">일정을 불러오는 중...</p>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">달력 뷰</h3>
            <p className="text-sm text-gray-500">달력 뷰는 곧 제공될 예정입니다</p>
          </div>
        ) : !loading && (
          <div className="space-y-4">
            {schedules.length > 0 ? (
              schedules.map((schedule) => {
                const status = getStatusFromSchedule(schedule.schedule || '');
                const isUrgent = status.urgency === 'high';
                
                return (
                  <Link
                    key={schedule.id || schedule.link}
                    href={`/calendar/${schedule.id || schedule.link}`}
                    className={`block bg-white rounded-xl p-5 border transition-all ${
                      isUrgent 
                        ? 'border-red-300 border-2 hover:border-red-400 hover:shadow-lg ring-2 ring-red-100' 
                        : 'border-gray-100 hover:border-[#3182F6]/30 hover:shadow-md'
                    }`}
                  >
                    {isUrgent && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md">
                          🔥 긴급
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isUrgent ? 'bg-red-50' : 'bg-[#3182F6]/10'
                        }`}>
                          <Building2 className={`w-6 h-6 ${isUrgent ? 'text-red-600' : 'text-[#3182F6]'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-1 ${isUrgent ? 'text-red-900' : 'text-gray-900'}`}>
                            {schedule.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{schedule.summary}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 ${status.color} text-xs font-medium rounded border ${
                              isUrgent ? 'border-red-200' : ''
                            }`}>
                              {status.label}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span className={isUrgent ? 'font-bold text-red-700' : ''}>
                                {schedule.schedule}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <TrendingUp className={`w-5 h-5 ${isUrgent ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">일정이 없습니다</h3>
                <p className="text-sm text-gray-500">
                  {filter === 'all' 
                    ? '등록된 공모주 일정이 없습니다' 
                    : '해당 필터에 맞는 일정이 없습니다'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

