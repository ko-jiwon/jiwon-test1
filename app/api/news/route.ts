import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

// 간단한 메모리 캐시 (30분 TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

/**
 * 네이버 금융 증시 뉴스 크롤링
 */
async function crawlNaverFinanceNews(): Promise<any[]> {
  try {
    const url = 'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258';
    
    console.log(`[네이버 금융] 크롤링 시작: ${url}`);
    
    // 타임아웃 설정 (15초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://finance.naver.com/',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`[네이버 금융] HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 네이버는 EUC-KR 인코딩을 사용하므로 iconv-lite로 디코딩
    const buffer = await response.arrayBuffer();
    let html: string;
    
    try {
      // EUC-KR로 디코딩 시도
      html = iconv.decode(Buffer.from(buffer), 'euc-kr');
      console.log('[네이버 금융] EUC-KR 디코딩 성공');
    } catch (eucKrError) {
      // EUC-KR 디코딩 실패 시 UTF-8로 시도
      console.warn('[네이버 금융] EUC-KR 디코딩 실패, UTF-8로 시도');
      try {
        html = iconv.decode(Buffer.from(buffer), 'utf-8');
      } catch (utf8Error) {
        // UTF-8도 실패하면 기본 텍스트로 시도
        console.warn('[네이버 금융] UTF-8 디코딩 실패, 기본 텍스트로 시도');
        html = await response.text();
      }
    }
    
    if (!html || html.length < 100) {
      console.error('[네이버 금융] HTML 응답이 비어있거나 너무 짧습니다.');
      return [];
    }
    
    const $ = cheerio.load(html);
    const newsItems: any[] = [];
    
    // .articleSubject 셀렉터로 뉴스 항목 추출
    $('.articleSubject').each((i, elem) => {
      if (newsItems.length >= 10) return false; // 최신 10개만
      
      const $elem = $(elem);
      const titleEl = $elem.find('a');
      let title = titleEl.text().trim();
      // 공백 정규화 및 특수문자 제거 (한글은 유지)
      title = title.replace(/\s+/g, ' ').replace(/[^\w\s가-힣.,!?()[\]{}:;'"\-]/g, '');
      let link = titleEl.attr('href') || '';
      
      // 링크 정규화
      if (link && !link.startsWith('http')) {
        if (link.startsWith('/')) {
          link = 'https://finance.naver.com' + link;
        } else {
          link = 'https://finance.naver.com/' + link;
        }
      }
      
      // 요약 추출 (.articleSummary)
      const $summary = $elem.next('.articleSummary');
      let summary = $summary.text().trim() || '';
      // 공백 정규화 및 특수문자 제거 (한글은 유지)
      summary = summary.replace(/\s+/g, ' ').replace(/[^\w\s가-힣.,!?()[\]{}:;'"\-]/g, '');
      
      // 날짜 추출 (부모 요소에서 .date 찾기)
      const $parent = $elem.closest('dl, li, .newsList');
      const date = $parent.find('.date, .wdate').text().trim() || '최근';
      
      // 언론사 추출
      const source = $parent.find('.press, .press_name').text().trim() || '네이버 금융';
      
      if (title && link && title.length > 5) {
        // 실제 뉴스 기사 URL인지 확인
        if (link.includes('news.naver.com') || link.includes('/news/') || link.includes('article')) {
          newsItems.push({
            title,
            url: link,
            link: link, // 호환성을 위해 둘 다 포함
            source: source,
            publishedAt: date,
            snippet: summary,
            summary: summary, // 호환성을 위해 둘 다 포함
          });
        }
      }
    });
    
    // .articleSubject로 충분하지 않으면 추가 셀렉터 시도
    if (newsItems.length < 5) {
      console.log('[네이버 금융] 추가 셀렉터 시도');
      $('dl dt a').each((i, elem) => {
        if (newsItems.length >= 10) return false;
        
        const $elem = $(elem);
        let title = $elem.text().trim();
        // 공백 정규화 및 특수문자 제거 (한글은 유지)
        title = title.replace(/\s+/g, ' ').replace(/[^\w\s가-힣.,!?()[\]{}:;'"\-]/g, '');
        let link = $elem.attr('href') || '';
        
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) {
            link = 'https://finance.naver.com' + link;
          } else {
            link = 'https://finance.naver.com/' + link;
          }
        }
        
        const $parent = $elem.closest('dl');
        let summary = $parent.find('dd').text().trim() || '';
        // 공백 정규화 및 특수문자 제거 (한글은 유지)
        summary = summary.replace(/\s+/g, ' ').replace(/[^\w\s가-힣.,!?()[\]{}:;'"\-]/g, '');
        const date = $parent.find('.date, .wdate').text().trim() || '최근';
        const source = $parent.find('.press, .press_name').text().trim() || '네이버 금융';
        
        if (title && link && title.length > 5) {
          if (link.includes('news.naver.com') || link.includes('/news/') || link.includes('article')) {
            // 중복 체크
            if (!newsItems.some(item => item.title === title || item.url === link)) {
              newsItems.push({
                title,
                url: link,
                link: link,
                source: source,
                publishedAt: date,
                snippet: summary,
                summary: summary,
              });
            }
          }
        }
      });
    }
    
    console.log(`✅ [네이버 금융] ${newsItems.length}개의 뉴스를 수집했습니다.`);
    return newsItems.slice(0, 10); // 최신 10개만
  } catch (error) {
    console.error('[네이버 금융] 크롤링 오류:', error);
    if (error instanceof Error) {
      console.error('[네이버 금융] 오류 상세:', error.message, error.stack);
    }
    return [];
  }
}

/**
 * 주식 뉴스 빠른 크롤링 API
 * GET /api/news
 * 
 * 네이버 금융 증시 뉴스만 크롤링
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log(`[뉴스 API] 요청 받음: refresh=${forceRefresh}`);
    
    const cacheKey = 'naver_finance_news';
    
    // 캐시 확인
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const elapsed = Date.now() - startTime;
        console.log(`[뉴스 API] 캐시에서 반환 (${elapsed}ms)`);
        return NextResponse.json({
          success: true,
          data: cached.data,
          count: cached.data.length,
          cached: true,
          timestamp: cached.timestamp,
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          },
        });
      }
    }

    console.log(`[뉴스 API] 크롤링 시작`);
    
    // 크롤링 타임아웃 설정 (20초)
    const crawlPromise = crawlNaverFinanceNews();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('크롤링 타임아웃 (20초 초과)')), 20000);
    });
    
    let newsItems;
    try {
      newsItems = await Promise.race([crawlPromise, timeoutPromise]);
    } catch (crawlError) {
      console.error('[뉴스 API] 크롤링 오류:', crawlError);
      
      // 캐시된 데이터가 있으면 반환
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('[뉴스 API] 크롤링 실패, 캐시된 데이터 반환');
        return NextResponse.json({
          success: true,
          data: cached.data,
          count: cached.data.length,
          cached: true,
          error: '최신 크롤링 실패, 캐시된 데이터 반환',
          timestamp: cached.timestamp,
        });
      }
      
      throw crawlError;
    }
    
    const elapsedTime = Date.now() - startTime;
    console.log(`[뉴스 API] 크롤링 완료: ${newsItems.length}개 (${elapsedTime}ms)`);

    if (!newsItems || newsItems.length === 0) {
      console.warn('[뉴스 API] 크롤링 결과가 비어있음');
      
      // 캐시된 데이터가 있으면 반환
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('[뉴스 API] 빈 결과, 캐시된 데이터 반환');
        return NextResponse.json({
          success: true,
          data: cached.data,
          count: cached.data.length,
          cached: true,
          error: '최신 뉴스 없음, 캐시된 데이터 반환',
          timestamp: cached.timestamp,
        });
      }
      
      return NextResponse.json({
        success: false,
        error: '뉴스를 가져오는데 실패했습니다',
        data: [],
        count: 0,
        timestamp: Date.now(),
      }, { status: 500 });
    }

    // 캐시에 저장
    cache.set(cacheKey, {
      data: newsItems,
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

    // 호환성을 위해 articles 필드도 포함
    return NextResponse.json({
      success: true,
      data: newsItems,
      articles: newsItems, // 기존 코드 호환성
      count: newsItems.length,
      cached: false,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
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
    const cacheKey = 'naver_finance_news';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('[뉴스 API] 에러 발생, 캐시된 데이터 반환');
      return NextResponse.json({
        success: true,
        data: cached.data,
        articles: cached.data, // 기존 코드 호환성
        count: cached.data.length,
        cached: true,
        error: '최신 크롤링 실패, 캐시된 데이터 반환',
        timestamp: cached.timestamp,
      });
    }

    return NextResponse.json({
      success: false,
      error: '뉴스를 가져오는데 실패했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      data: [],
      articles: [], // 기존 코드 호환성
      count: 0,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
