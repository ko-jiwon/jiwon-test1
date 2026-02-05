'use client';

import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export default function Navigation() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/" className={`${playfair.className} text-2xl font-bold text-gray-900 hover:text-[#3182F6] transition-colors`}>
            Stock News
          </Link>
        </div>
      </div>
    </header>
  );
}

