'use client';

import { IPONews } from '@/types';
import { Calendar, Building2, FileText, ExternalLink } from 'lucide-react';

interface ArticleCardProps {
  article: IPONews;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
              {article.title}
            </h3>
          </div>
        </div>

        {/* Schedule */}
        {article.schedule && article.schedule !== '정보 없음' && (
          <div className="mb-4 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 font-medium">{article.schedule}</p>
          </div>
        )}

        {/* Summary */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase">핵심 요약</span>
          </div>
          <p className="text-gray-700 leading-relaxed line-clamp-4">
            {article.summary}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>원문 보기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          {article.created_at && (
            <p className="text-xs text-gray-400 mt-2">
              {new Date(article.created_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

