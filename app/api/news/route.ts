import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '경제';
    
    const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query + ' 경제')}&sort=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    let html: string;
    
    try {
      html = iconv.decode(Buffer.from(buffer), 'euc-kr');
    } catch (e) {
      html = iconv.decode(Buffer.from(buffer), 'utf-8');
    }
    
    const $ = cheerio.load(html);
    const newsItems: any[] = [];
    
    $('.news_area').each((i, elem) => {
      if (newsItems.length >= 30) return false;
      
      const title = $(elem).find('.news_tit').attr('title') || $(elem).find('.news_tit').text().trim();
      let link = $(elem).find('.news_tit').attr('href') || '';
      const source = $(elem).find('.info.press, .press').text().trim();
      const date = $(elem).find('.info').last().text().trim();
      const summary = $(elem).find('.news_dsc, .dsc_wrap').text().trim();
      
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
            id: `${Date.now()}-${i}`,
            title: title.trim(),
            link: link,
            url: link,
            source: source || '언론사',
            publishedAt: date || '최근',
            summary: summary || '',
            snippet: summary || '',
          });
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: newsItems,
      articles: newsItems, // 호환성을 위해
      count: newsItems.length
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch news', 
        data: [],
        articles: []
      },
      { status: 500 }
    );
  }
}
