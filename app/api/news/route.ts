import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '주식';
    
    console.log('🔍 뉴스 검색:', query);
    
    const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}&sort=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'utf-8');
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $('.news_area').each((i, elem) => {
      if (newsItems.length >= 30) return false;
      
      const titleElem = $(elem).find('.news_tit');
      const title = titleElem.attr('title') || titleElem.text().trim();
      let link = titleElem.attr('href') || '';
      const source = $(elem).find('.info.press, .press').text().trim() || '언론사';
      const date = $(elem).find('.info').last().text().trim() || '최근';
      const summary = $(elem).find('.news_dsc, .dsc_wrap').text().trim() || '';
      
      // 링크 정규화
      if (link && !link.startsWith('http')) {
        if (link.startsWith('/')) {
          link = `https://search.naver.com${link}`;
        } else {
          link = `https://search.naver.com/${link}`;
        }
      }
      
      if (title && link && title.length > 5) {
        // 메인 페이지나 쓸모없는 링크 제외
        if (link.includes('naver.com/main') || (link.includes('naver.com/') && !link.includes('/news/'))) {
          return;
        }
        
        // 실제 뉴스 기사 URL인지 확인
        if (link.includes('news.naver.com') || link.includes('news/')) {
          newsItems.push({
            id: `news-${Date.now()}-${i}`,
            title,
            link,
            source,
            publishedAt: date,
            summary
          });
        }
      }
    });
    
    console.log(`✅ ${newsItems.length}개의 뉴스 수집 완료`);
    
    return NextResponse.json({
      success: true,
      data: newsItems,
      articles: newsItems, // 호환성을 위해
      count: newsItems.length,
      query
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('❌ 크롤링 에러:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        data: [],
        articles: []
      },
      { status: 500 }
    );
  }
}
