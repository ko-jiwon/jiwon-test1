'use client';

import { IPONews } from '@/types';
import { Calendar, ExternalLink, ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: IPONews;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#3182F6]/30 hover:shadow-lg transition-all duration-200 cursor-pointer block"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#3182F6] transition-colors">
          {article.title}
        </h3>
        {article.schedule && article.schedule !== '정보 없음' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{article.schedule}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
        {article.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {article.created_at && (
            <span>
              {new Date(article.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[#3182F6] text-sm font-medium group-hover:gap-2 transition-all">
          <span>원문 보기</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </a>
  );
}

