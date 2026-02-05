import { NextRequest, NextResponse } from 'next/server';
import { crawlEconomyNews } from '@/lib/crawler';

// 간단한 메모리 캐시 (30분 TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

/**
 * 공모주 뉴스 빠른 크롤링 API
 * GET /api/news
 * 
 * 캐시된 데이터를 우선 반환하고, 없으면 크롤링 수행
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const searchQuery = searchParams.get('q') || '공모주';
    
    console.log(`[뉴스 API] 요청 받음: q=${searchQuery}, refresh=${forceRefresh}`);
    
    const cacheKey = `news_${searchQuery}`;
    
    // 캐시 확인
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const elapsed = Date.now() - startTime;
        console.log(`[뉴스 API] 캐시에서 반환: ${searchQuery} (${elapsed}ms)`);
        return NextResponse.json(
          { 
            articles: cached.data,
            cached: true,
            timestamp: cached.timestamp,
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
          }
        );
      }
    }

    console.log(`[뉴스 API] 크롤링 시작: ${searchQuery}`);
    
    // 크롤링 타임아웃 설정 (20초)
    const crawlPromise = crawlEconomyNews(searchQuery);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('크롤링 타임아웃 (20초 초과)')), 20000);
    });
    
    let articles;
    try {
      articles = await Promise.race([crawlPromise, timeoutPromise]);
    } catch (crawlError) {
      console.error('[뉴스 API] 크롤링 오류:', crawlError);
      
      // 캐시된 데이터가 있으면 반환
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('[뉴스 API] 크롤링 실패, 캐시된 데이터 반환');
        return NextResponse.json(
          { 
            articles: cached.data,
            cached: true,
            error: '최신 크롤링 실패, 캐시된 데이터 반환',
            timestamp: cached.timestamp,
          }
        );
      }
      
      throw crawlError;
    }
    
    const elapsedTime = Date.now() - startTime;
    console.log(`[뉴스 API] 크롤링 완료: ${articles.length}개 (${elapsedTime}ms)`);

    if (!articles || articles.length === 0) {
      console.warn('[뉴스 API] 크롤링 결과가 비어있음');
      
      // 캐시된 데이터가 있으면 반환
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('[뉴스 API] 빈 결과, 캐시된 데이터 반환');
        return NextResponse.json(
          { 
            articles: cached.data,
            cached: true,
            error: '최신 뉴스 없음, 캐시된 데이터 반환',
            timestamp: cached.timestamp,
          }
        );
      }
      
      return NextResponse.json(
        { 
          articles: [],
          cached: false,
          error: '크롤링된 뉴스가 없습니다.',
          timestamp: Date.now(),
        }
      );
    }

    // 캐시에 저장
    cache.set(cacheKey, {
      data: articles,
      timestamp: Date.now(),
    });

    // 오래된 캐시 정리 (메모리 관리)
    if (cache.size > 10) {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(
      { 
        articles: articles.slice(0, 10), // 최대 10개
        cached: false,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[뉴스 API] 오류 (${elapsed}ms):`, error);
    
    if (error instanceof Error) {
      console.error('[뉴스 API] 오류 상세:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
    
    // 캐시된 데이터가 있으면 반환 (에러 발생 시)
    const searchQuery = new URL(request.url).searchParams.get('q') || '공모주';
    const cacheKey = `news_${searchQuery}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('[뉴스 API] 에러 발생, 캐시된 데이터 반환');
      return NextResponse.json(
        { 
          articles: cached.data,
          cached: true,
          error: '최신 크롤링 실패, 캐시된 데이터 반환',
          timestamp: cached.timestamp,
        }
      );
    }

    return NextResponse.json(
      { 
        error: '뉴스 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        articles: [],
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

