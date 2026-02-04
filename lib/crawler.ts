import * as cheerio from 'cheerio';
import { NewsArticle } from '@/types';

/**
 * 네이버 경제 뉴스에서 키워드 검색 크롤링
 */
export async function crawlNaverEconomyNews(searchQuery: string): Promise<NewsArticle[]> {
  try {
    // 네이버 뉴스 검색 URL (경제 카테고리)
    const searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(searchQuery)}&sm=tab_jum&sort=1`;
    
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

    // 네이버 뉴스 검색 결과 파싱
    $('.news_area, .news_wrap').each((index, element) => {
      if (articles.length >= 10) return false;

      const $el = $(element);
      const titleEl = $el.find('.news_tit, a.news_tit');
      const title = titleEl.text().trim();
      const link = titleEl.attr('href') || $el.find('a').first().attr('href');
      const snippet = $el.find('.news_dsc, .dsc_wrap').text().trim();
      const source = $el.find('.press, .info_group .press').text().trim();

      if (title && link) {
        articles.push({
          title,
          url: link.startsWith('http') ? link : `https://search.naver.com${link}`,
          snippet: snippet || '',
          source: source || '네이버 뉴스',
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('네이버 경제 뉴스 크롤링 오류:', error);
    return [];
  }
}

/**
 * Google News에서 키워드 검색 크롤링 (최신순)
 */
export async function crawlGoogleNews(searchQuery: string = '공모주'): Promise<NewsArticle[]> {
  try {
    // Google News 검색 URL (최신순 정렬)
    // when:1d = 최근 1일, when:7d = 최근 7일 등
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=ko&gl=KR&ceid=KR:ko&when=1d`;
    
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
      const timeEl = $el.find('time').first();
      const publishedTime = timeEl.attr('datetime') || timeEl.text().trim();

      if (title && relativeLink) {
        // Google News 링크는 상대 경로이므로 절대 경로로 변환
        let fullUrl = '';
        if (relativeLink.startsWith('./')) {
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

    // 날짜 기준으로 정렬 (최신순)
    return articles.slice(0, 10);
  } catch (error) {
    console.error('Google News 크롤링 오류:', error);
    throw error;
  }
}

/**
 * 구글과 네이버에서 경제 뉴스 크롤링 (통합)
 * 검색 날짜 기준 최신 기사 10개 수집
 */
export async function crawlEconomyNews(searchQuery: string = '공모주'): Promise<NewsArticle[]> {
  try {
    const allArticles: NewsArticle[] = [];
    const existingUrls = new Set<string>();

    // 1. 네이버 경제 뉴스 크롤링
    try {
      console.log(`🔍 네이버 경제 뉴스 크롤링: ${searchQuery}`);
      const naverArticles = await crawlNaverEconomyNews(searchQuery);
      
      for (const article of naverArticles) {
        if (allArticles.length >= 10) break;
        if (!existingUrls.has(article.url)) {
          allArticles.push(article);
          existingUrls.add(article.url);
        }
      }
    } catch (error) {
      console.error('네이버 크롤링 실패:', error);
    }

    // 2. Google News 크롤링
    try {
      console.log(`🔍 Google News 크롤링: ${searchQuery}`);
      const googleArticles = await crawlGoogleNews(searchQuery);
      
      for (const article of googleArticles) {
        if (allArticles.length >= 10) break;
        if (!existingUrls.has(article.url)) {
          allArticles.push(article);
          existingUrls.add(article.url);
        }
      }
    } catch (error) {
      console.error('Google News 크롤링 실패:', error);
    }

    // 최신순으로 정렬 (날짜 기준, 최대 10개)
    return allArticles.slice(0, 10);
  } catch (error) {
    console.error('경제 뉴스 크롤링 오류:', error);
    // 최후의 수단으로 Google News만 시도
    try {
      return await crawlGoogleNews(searchQuery);
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
    content = $('.go_trans._article_content, #articleBodyContents, .article_body, #articleBodyContents').first().text().trim();
    
    // 일반적인 뉴스 사이트
    if (!content) {
      content = $('article .article-body, article .post-content, .article-body, .post-content, .news-content, .content, .article_view').first().text().trim();
    }
    
    // 최후의 수단: article 태그 또는 main 태그
    if (!content) {
      content = $('article, main').first().text().trim();
    }
    
    // 그래도 없으면 body에서 스크립트 제거
    if (!content) {
      $('script, style, nav, header, footer, .ad, .advertisement').remove();
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
