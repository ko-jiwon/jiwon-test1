import * as cheerio from 'cheerio';
import { NewsArticle } from '@/types';

/**
 * 네이버 증권 공모주 일정 페이지에서 뉴스 크롤링
 */
export async function crawlNaverIPO(): Promise<NewsArticle[]> {
  try {
    const url = 'https://finance.naver.com/sise/sise_ipo.nhn';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // 네이버 증권 공모주 일정 테이블에서 뉴스 링크 추출
    $('.type_1 tbody tr').each((index, element) => {
      if (articles.length >= 10) return false;

      const $el = $(element);
      const titleEl = $el.find('a');
      const title = titleEl.text().trim();
      const relativeLink = titleEl.attr('href');

      if (title && relativeLink) {
        // 상대 경로를 절대 경로로 변환
        const fullUrl = relativeLink.startsWith('http')
          ? relativeLink
          : `https://finance.naver.com${relativeLink}`;

        articles.push({
          title,
          url: fullUrl,
          snippet: $el.find('td').eq(1).text().trim() || '',
          source: '네이버 증권',
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('네이버 증권 크롤링 오류:', error);
    // 네이버 크롤링 실패 시 빈 배열 반환 (구글 뉴스로 대체)
    return [];
  }
}

/**
 * Google News에서 '2월 공모주' 관련 뉴스 크롤링
 */
export async function crawlGoogleNews(searchQuery: string = '2월 공모주'): Promise<NewsArticle[]> {
  try {
    // Google News 검색 URL
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=ko&gl=KR&ceid=KR:ko`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // Google News 구조에 맞게 파싱
    $('article').each((index, element) => {
      if (articles.length >= 10) return false; // 최대 10개만 수집

      const $el = $(element);
      const titleEl = $el.find('h3, h4').first();
      const title = titleEl.text().trim();
      const linkEl = $el.find('a').first();
      const relativeLink = linkEl.attr('href');
      const snippet = $el.find('div').first().text().trim();
      const source = $el.find('span').first().text().trim();

      if (title && relativeLink) {
        // Google News 링크는 상대 경로이므로 절대 경로로 변환
        // Google News 링크 형식: ./articles/CBMi...
        let fullUrl = '';
        if (relativeLink.startsWith('./')) {
          // Google News 리다이렉트 URL 추출
          const articleId = relativeLink.replace('./articles/', '');
          fullUrl = `https://news.google.com/articles/${articleId}`;
        } else if (relativeLink.startsWith('http')) {
          fullUrl = relativeLink;
        } else {
          fullUrl = `https://news.google.com${relativeLink}`;
        }

        articles.push({
          title,
          url: fullUrl,
          snippet: snippet || '',
          source: source || 'Google News',
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('Google News 크롤링 오류:', error);
    throw error;
  }
}

/**
 * 네이버 증권 또는 Google News에서 공모주 뉴스 크롤링 (우선순위: 네이버 > 구글)
 */
export async function crawlIPONews(): Promise<NewsArticle[]> {
  try {
    // 먼저 네이버 증권 시도
    const naverArticles = await crawlNaverIPO();
    
    if (naverArticles.length >= 10) {
      return naverArticles.slice(0, 10);
    }

    // 네이버에서 충분하지 않으면 Google News로 보완
    const googleArticles = await crawlGoogleNews('2월 공모주');
    
    // 중복 제거 (URL 기준)
    const allArticles = [...naverArticles];
    const existingUrls = new Set(naverArticles.map(a => a.url));
    
    for (const article of googleArticles) {
      if (allArticles.length >= 10) break;
      if (!existingUrls.has(article.url)) {
        allArticles.push(article);
        existingUrls.add(article.url);
      }
    }

    return allArticles.slice(0, 10);
  } catch (error) {
    console.error('공모주 뉴스 크롤링 오류:', error);
    // 최후의 수단으로 Google News만 시도
    try {
      return await crawlGoogleNews('2월 공모주');
    } catch (fallbackError) {
      console.error('모든 크롤링 시도 실패:', fallbackError);
      return [];
    }
  }
}

/**
 * 뉴스 기사 본문 내용 추출
 */
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // 타임아웃 설정 (10초)
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 다양한 뉴스 사이트 구조에 맞게 본문 추출
    let content = '';
    
    // 네이버 뉴스
    content = $('.go_trans._article_content, #articleBodyContents, .article_body').first().text().trim();
    
    // 일반적인 뉴스 사이트
    if (!content) {
      content = $('article .article-body, article .post-content, .article-body, .post-content, .news-content, .content').first().text().trim();
    }
    
    // 최후의 수단: article 태그 또는 main 태그
    if (!content) {
      content = $('article, main').first().text().trim();
    }
    
    // 그래도 없으면 body에서 스크립트 제거
    if (!content) {
      $('script, style, nav, header, footer').remove();
      content = $('body').text().trim();
    }

    // 공백 정리
    content = content.replace(/\s+/g, ' ').trim();
    
    return content || '';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`기사 내용 가져오기 타임아웃: ${url}`);
    } else {
      console.error(`기사 내용 가져오기 오류 (${url}):`, error);
    }
    return '';
  }
}

