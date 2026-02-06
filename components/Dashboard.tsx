'use client';

import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
