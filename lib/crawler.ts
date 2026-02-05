import * as cheerio from 'cheerio';
import { NewsArticle } from '@/types';

/**
 * 네이버 경제 뉴스에서 키워드 검색 크롤링
 */
export async function crawlNaverEconomyNews(searchQuery: string): Promise<NewsArticle[]> {
  try {
    // 네이버 뉴스 검색 URL (경제 카테고리, 최신순)
    const searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(searchQuery + ' 공모주')}&sm=tab_jum&sort=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.naver.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // 네이버 뉴스 검색 결과 파싱 (다양한 셀렉터 시도)
    const selectors = [
      '.news_area',
      '.news_wrap',
      '.news_info',
      '.bx',
      'div[class*="news"]',
    ];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 10) return false;

        const $el = $(element);
        
        // 제목 추출 (다양한 셀렉터 시도)
        const titleEl = $el.find('.news_tit, a.news_tit, .title_link, a[href*="news.naver.com"]').first();
        const title = titleEl.text().trim() || titleEl.attr('title') || '';
        
        // 링크 추출
        let link = titleEl.attr('href') || $el.find('a[href*="news.naver.com"]').first().attr('href') || $el.find('a').first().attr('href');
        
        // snippet 추출
        const snippet = $el.find('.news_dsc, .dsc_wrap, .api_txt_lines, .dsc').text().trim();
        
        // 출처 추출
        const source = $el.find('.press, .info_group .press, .info').text().trim();

        if (title && link && title.length > 5) {
          // 네이버 뉴스 링크 정규화
          if (link.startsWith('http')) {
            // 이미 절대 경로
          } else if (link.startsWith('/')) {
            link = `https://search.naver.com${link}`;
          } else {
            link = `https://search.naver.com/${link}`;
          }

          // 중복 체크
          if (!articles.some(a => a.url === link || a.title === title)) {
            articles.push({
              title,
              url: link,
              snippet: snippet || '',
              source: source || '네이버 뉴스',
            });
          }
        }
      });

      if (articles.length >= 10) break;
    }

    console.log(`✅ 네이버에서 ${articles.length}개의 뉴스를 수집했습니다.`);
    return articles.slice(0, 10);
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
    // Google News 검색 URL (최신순 정렬, 한국어)
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery + ' 공모주')}&hl=ko&gl=KR&ceid=KR:ko&when=7d`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // Google News 구조에 맞게 파싱 (다양한 셀렉터 시도)
    $('article').each((index, element) => {
      if (articles.length >= 10) return false;

      const $el = $(element);
      
      // 제목 추출
      const titleEl = $el.find('h3, h4, a[href*="articles"]').first();
      const title = titleEl.text().trim();
      
      // 링크 추출
      const linkEl = $el.find('a[href*="articles"]').first();
      const relativeLink = linkEl.attr('href');
      
      // snippet 추출
      const snippet = $el.find('div[class*="snippet"], div[class*="description"]').text().trim();
      
      // 출처 추출
      const source = $el.find('span[class*="source"], div[class*="source"]').text().trim();

      if (title && relativeLink && title.length > 5) {
        // Google News 링크는 상대 경로이므로 절대 경로로 변환
        let fullUrl = '';
        if (relativeLink.startsWith('./')) {
          fullUrl = `https://news.google.com${relativeLink.substring(1)}`;
        } else if (relativeLink.startsWith('http')) {
          fullUrl = relativeLink;
        } else {
          fullUrl = `https://news.google.com${relativeLink}`;
        }

        // 중복 체크
        if (!articles.some(a => a.url === fullUrl || a.title === title)) {
          articles.push({
            title,
            url: fullUrl,
            snippet: snippet || '',
            source: source || 'Google News',
          });
        }
      }
    });

    console.log(`✅ Google News에서 ${articles.length}개의 뉴스를 수집했습니다.`);
    return articles.slice(0, 10);
  } catch (error) {
    console.error('Google News 크롤링 오류:', error);
    return []; // 에러 발생 시 빈 배열 반환 (throw 대신)
  }
}

/**
 * 다음 뉴스에서 키워드 검색 크롤링
 */
export async function crawlDaumNews(searchQuery: string): Promise<NewsArticle[]> {
  try {
    const searchUrl = `https://search.daum.net/search?w=news&q=${encodeURIComponent(searchQuery + ' 공모주')}&sort=recency`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    $('.wrap_cont, .item_news').each((index, element) => {
      if (articles.length >= 10) return false;

      const $el = $(element);
      const titleEl = $el.find('a[href*="v.daum.net"]').first();
      const title = titleEl.text().trim();
      const link = titleEl.attr('href');
      const snippet = $el.find('.desc, .f_eb').text().trim();
      const source = $el.find('.info_news, .f_nb').text().trim();

      if (title && link && title.length > 5) {
        articles.push({
          title,
          url: link,
          snippet: snippet || '',
          source: source || '다음 뉴스',
        });
      }
    });

    console.log(`✅ 다음 뉴스에서 ${articles.length}개의 뉴스를 수집했습니다.`);
    return articles.slice(0, 10);
  } catch (error) {
    console.error('다음 뉴스 크롤링 오류:', error);
    return [];
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
    const existingTitles = new Set<string>();

    // 검색어에 "공모주"가 없으면 추가
    const enhancedQuery = searchQuery.includes('공모주') ? searchQuery : `${searchQuery} 공모주`;

    // 1. 네이버 경제 뉴스 크롤링
    try {
      console.log(`🔍 네이버 경제 뉴스 크롤링: ${enhancedQuery}`);
      const naverArticles = await crawlNaverEconomyNews(enhancedQuery);
      
      for (const article of naverArticles) {
        if (allArticles.length >= 10) break;
        const urlKey = article.url.split('?')[0]; // 쿼리 파라미터 제거
        if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
          allArticles.push(article);
          existingUrls.add(urlKey);
          existingTitles.add(article.title);
        }
      }
    } catch (error) {
      console.error('네이버 크롤링 실패:', error);
    }

    // 2. Google News 크롤링
    try {
      console.log(`🔍 Google News 크롤링: ${enhancedQuery}`);
      const googleArticles = await crawlGoogleNews(enhancedQuery);
      
      for (const article of googleArticles) {
        if (allArticles.length >= 10) break;
        const urlKey = article.url.split('?')[0];
        if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
          allArticles.push(article);
          existingUrls.add(urlKey);
          existingTitles.add(article.title);
        }
      }
    } catch (error) {
      console.error('Google News 크롤링 실패:', error);
    }

    // 3. 다음 뉴스 크롤링 (네이버와 구글이 실패한 경우)
    if (allArticles.length < 5) {
      try {
        console.log(`🔍 다음 뉴스 크롤링: ${enhancedQuery}`);
        const daumArticles = await crawlDaumNews(enhancedQuery);
        
        for (const article of daumArticles) {
          if (allArticles.length >= 10) break;
          const urlKey = article.url.split('?')[0];
          if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
            allArticles.push(article);
            existingUrls.add(urlKey);
            existingTitles.add(article.title);
          }
        }
      } catch (error) {
        console.error('다음 뉴스 크롤링 실패:', error);
      }
    }

    console.log(`✅ 총 ${allArticles.length}개의 뉴스를 수집했습니다.`);
    return allArticles.slice(0, 10);
  } catch (error) {
    console.error('경제 뉴스 크롤링 오류:', error);
    return [];
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
