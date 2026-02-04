'use client';

import { IPONews } from '@/types';
import { Calendar, ArrowRight, Clock, Tag } from 'lucide-react';

interface ArticleCardProps {
  article: IPONews;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const keywords = article.keywords?.split(',').map(k => k.trim()).filter(k => k) || [];

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#3182F6]/30 hover:shadow-md transition-all duration-200 cursor-pointer block"
    >
      <div className="flex items-start justify-between gap-4">
        {/* 왼쪽: 내용 */}
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#3182F6] transition-colors">
            {article.title}
          </h3>
          
          {/* 요약 */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
            {article.summary}
          </p>
          
          {/* 핵심 키워드 */}
          {keywords.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              {keywords.slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
          
          {/* 하단 정보 */}
          <div className="flex items-center gap-4 flex-wrap">
            {article.schedule && article.schedule !== '정보 없음' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">{article.schedule}</span>
              </div>
            )}
            {article.created_at && (
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(article.created_at).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* 오른쪽: 화살표 아이콘 */}
        <div className="flex-shrink-0 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-[#3182F6]/10 flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#3182F6] transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}
