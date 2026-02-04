'use client';

import { useState, useEffect } from 'react';
import { Building2, Calendar, DollarSign, Users, AlertTriangle, TrendingUp, TrendingDown, Download, Bell, Loader2, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { IPONews } from '@/types';
import ArticleCard from '@/components/ArticleCard';

interface IPODetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IPODetailPage({ params }: IPODetailPageProps) {
  const [id, setId] = useState<string>('');
  const [ipoData, setIpoData] = useState<IPONews | null>(null);
  const [relatedNews, setRelatedNews] = useState<IPONews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<{
    level: 'low' | 'medium' | 'high';
    factors: string[];
  } | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchIPODetails();
    }
  }, [id]);

  const fetchIPODetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/ipo/${id}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setIpoData(data.ipo);
      setRelatedNews(data.relatedNews || []);
      
      // 뉴스 기반 리스크 분석
      analyzeRisk(data.ipo, data.relatedNews || []);
    } catch (err) {
      console.error('IPO 정보 불러오기 오류:', err);
      setError(err instanceof Error ? err.message : 'IPO 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = (ipo: IPONews, news: IPONews[]) => {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // 키워드 분석
    const keywords = ipo.keywords?.toLowerCase() || '';
    const summary = ipo.summary?.toLowerCase() || '';
    const title = ipo.title?.toLowerCase() || '';

    // 부정적 키워드 체크
    const negativeKeywords = ['리스크', '우려', '부진', '하락', '실적부진', '손실', '경고', '위험'];
    const positiveKeywords = ['성장', '상승', '호재', '기대', '긍정', '수익', '기대감'];

    let negativeCount = 0;
    let positiveCount = 0;

    negativeKeywords.forEach(keyword => {
      if (keywords.includes(keyword) || summary.includes(keyword) || title.includes(keyword)) {
        negativeCount++;
        riskFactors.push(`부정적 키워드 발견: ${keyword}`);
      }
    });

    positiveKeywords.forEach(keyword => {
      if (keywords.includes(keyword) || summary.includes(keyword) || title.includes(keyword)) {
        positiveCount++;
      }
    });

    // 관련 뉴스 개수 분석
    if (news.length === 0) {
      riskFactors.push('관련 뉴스 정보 부족');
      riskScore += 1;
    }

    // 부정적 키워드가 많으면 리스크 증가
    if (negativeCount > positiveCount) {
      riskScore += 2;
    } else if (negativeCount > 0) {
      riskScore += 1;
    }

    // 일정 정보 부재
    if (!ipo.schedule || ipo.schedule === '정보 없음') {
      riskFactors.push('일정 정보 부족');
      riskScore += 1;
    }

    // 리스크 레벨 결정
    let level: 'low' | 'medium' | 'high';
    if (riskScore >= 3) {
      level = 'high';
    } else if (riskScore >= 1) {
      level = 'medium';
    } else {
      level = 'low';
    }

    setRiskAnalysis({ level, factors: riskFactors.length > 0 ? riskFactors : ['현재 특별한 리스크 요인은 발견되지 않았습니다'] });
  };

  const getStatusFromSchedule = (schedule: string): { label: string; color: string } => {
    if (schedule.includes('청약') || schedule.includes('청약중')) {
      return { label: '청약중', color: 'bg-emerald-50 text-emerald-700' };
    } else if (schedule.includes('수요예측') || schedule.includes('수요')) {
      return { label: '수요예측', color: 'bg-blue-50 text-blue-700' };
    } else if (schedule.includes('상장') || schedule.includes('상장예정')) {
      return { label: '상장예정', color: 'bg-purple-50 text-purple-700' };
    }
    return { label: '일정확인', color: 'bg-gray-50 text-gray-700' };
  };

  const handleDownloadCalendar = () => {
    if (!ipoData || !ipoData.schedule) return;

    // 간단한 iCal 파일 생성
    const scheduleText = ipoData.schedule;
    const dateMatch = scheduleText.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    
    if (!dateMatch) {
      alert('일정 정보를 파싱할 수 없습니다.');
      return;
    }

    const [, year, month, day] = dateMatch;
    const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IPO Calendar//EN
BEGIN:VEVENT
UID:${ipoData.id}@ipo-calendar
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${ipoData.title} - ${ipoData.schedule}
DESCRIPTION:${ipoData.summary}
URL:${ipoData.link}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ipoData.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNotificationRequest = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'granted') {
      // 이미 허용됨
      if (ipoData && ipoData.schedule) {
        scheduleNotification(ipoData);
      }
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && ipoData && ipoData.schedule) {
        scheduleNotification(ipoData);
      }
    } else {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
    }
  };

  const scheduleNotification = (ipo: IPONews) => {
    if (!ipo.schedule) return;

    const scheduleText = ipo.schedule;
    const dateMatch = scheduleText.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    
    if (!dateMatch) {
      alert('일정 정보를 파싱할 수 없습니다.');
      return;
    }

    const [, year, month, day] = dateMatch;
    const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const now = new Date();
    const timeUntilEvent = eventDate.getTime() - now.getTime();

    if (timeUntilEvent <= 0) {
      alert('이미 지난 일정입니다.');
      return;
    }

    // 일정 하루 전 알림
    const notificationTime = timeUntilEvent - (24 * 60 * 60 * 1000);
    
    if (notificationTime > 0) {
      setTimeout(() => {
        new Notification(`${ipo.title} 청약 알림`, {
          body: `내일 ${ipo.schedule}입니다. 청약을 놓치지 마세요!`,
          icon: '/favicon.ico',
          tag: `ipo-${ipo.id}`,
        });
      }, notificationTime);
      
      alert('알림이 설정되었습니다. 일정 하루 전에 알림을 받으실 수 있습니다.');
    } else {
      // 이미 하루 전이 지났으면 당일 알림
      setTimeout(() => {
        new Notification(`${ipo.title} 청약 알림`, {
          body: `오늘 ${ipo.schedule}입니다!`,
          icon: '/favicon.ico',
          tag: `ipo-${ipo.id}`,
        });
      }, Math.max(0, timeUntilEvent));
      
      alert('알림이 설정되었습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#3182F6] animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !ipoData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            ← 일정 목록으로
          </Link>
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600">
            {error || 'IPO 정보를 찾을 수 없습니다.'}
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusFromSchedule(ipoData.schedule || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← 일정 목록으로
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 rounded-xl bg-[#3182F6]/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-[#3182F6]" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{ipoData.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-3 py-1 ${status.color} text-sm font-medium rounded-lg`}>
                    {status.label}
                  </span>
                  {ipoData.schedule && (
                    <span className="text-sm text-gray-600">{ipoData.schedule}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCalendar}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="캘린더에 추가"
              >
                <Download className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={handleNotificationRequest}
                className="flex items-center gap-2 px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors"
                title="알림 설정"
              >
                <Bell className="w-4 h-4" />
                알림
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">요약</h2>
          <p className="text-gray-600 leading-relaxed">{ipoData.summary}</p>
          {ipoData.keywords && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {ipoData.keywords.split(',').map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Risk Analysis */}
        {riskAnalysis && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className={`w-5 h-5 ${
                riskAnalysis.level === 'high' ? 'text-red-600' :
                riskAnalysis.level === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`} />
              <h2 className="text-lg font-bold text-gray-900">리스크 분석</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                riskAnalysis.level === 'high' ? 'bg-red-50 text-red-700' :
                riskAnalysis.level === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
              }`}>
                {riskAnalysis.level === 'high' ? '높음' :
                 riskAnalysis.level === 'medium' ? '보통' : '낮음'}
              </span>
            </div>
            <ul className="space-y-2">
              {riskAnalysis.factors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Schedule Details */}
        {ipoData.schedule && ipoData.schedule !== '정보 없음' && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-[#3182F6]" />
              <h2 className="text-lg font-bold text-gray-900">일정 정보</h2>
            </div>
            <p className="text-gray-700 font-medium">{ipoData.schedule}</p>
          </div>
        )}

        {/* Related News */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">관련 뉴스</h2>
            <Link
              href={`/news?stock=${encodeURIComponent(ipoData.title)}`}
              className="text-sm text-[#3182F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
            >
              전체 뉴스 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {relatedNews.length > 0 ? (
            <div className="space-y-3">
              {relatedNews.map((article) => (
                <ArticleCard key={article.id || article.link} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              관련 뉴스가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
