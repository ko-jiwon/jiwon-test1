'use client';

import { IPONews } from '@/types';

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
      className="group bg-white p-4 border border-gray-200 rounded-[6px] hover:shadow-md transition-shadow cursor-pointer block"
    >
      {/* 제목 */}
      <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-[#3182F6] transition-colors">
        {article.title}
      </h3>
      
      {/* 요약 */}
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {article.summary}
      </p>
      
      {/* 하단 정보 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {article.source && (
          <>
            <span>{article.source}</span>
            <span>•</span>
          </>
        )}
        {article.created_at && (
          <span>
            {new Date(article.created_at).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {article.publishedAt && !article.created_at && (
          <span>{article.publishedAt}</span>
        )}
      </div>
    </a>
  );
}
