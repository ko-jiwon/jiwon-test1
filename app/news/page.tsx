'use client';

import { Suspense } from 'react';
import NewsContent from './NewsContent';

export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <NewsContent />
    </Suspense>
  );
}
