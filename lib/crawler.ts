import * as cheerio from 'cheerio';
import { NewsArticle } from '@/types';

/**
 * 네이버 금융 증시 뉴스 페이지 크롤링
 */
export async function crawlNaverFinanceNews(): Promise<NewsArticle[]> {
  try {
    // 네이버 금융 증시 뉴스 페이지
    const financeUrl = 'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258';
    
    console.log(`[네이버 금융] 크롤링 시작: ${financeUrl}`);
    
    // 타임아웃 설정 (15초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    let response;
    try {
      response = await fetch(financeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://finance.naver.com/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[네이버 금융] 요청 타임아웃 (15초 초과)');
        throw new Error('네이버 금융 뉴스 크롤링 타임아웃');
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error(`[네이버 금융] HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      console.error('[네이버 금융] HTML 응답이 비어있거나 너무 짧습니다.');
      return [];
    }
    
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // 네이버 금융 뉴스 리스트 파싱
    console.log(`[네이버 금융] HTML 파싱 시작 (길이: ${html.length})`);
    
    // 네이버 금융 뉴스 구조: dl > dt > a (제목), dl > dd (요약)
    $('dl').each((index, element) => {
      if (articles.length >= 30) return false;

      const $dl = $(element);
      
      // 제목과 링크 추출 (dt > a)
      const $titleEl = $dl.find('dt a').first();
      const title = $titleEl.text().trim() || $titleEl.attr('title') || '';
      let link = $titleEl.attr('href') || '';
      
      // 요약 추출 (dd)
      const snippet = $dl.find('dd').first().text().trim();
      
      // 출처 추출
      const source = $dl.find('.press, .press_name, .articleSummary').text().trim() || 
                     $dl.find('dd .press').text().trim();
      
      // 날짜 추출
      const date = $dl.find('.date, .wdate').text().trim() || 
                   $dl.find('dd .date').text().trim();

      if (title && link && title.length > 5) {
        // 링크 정규화
        if (link.startsWith('http')) {
          // 이미 절대 경로
        } else if (link.startsWith('/')) {
          link = `https://finance.naver.com${link}`;
        } else if (link.startsWith('./')) {
          link = `https://finance.naver.com${link.substring(1)}`;
        } else {
          link = `https://finance.naver.com/${link}`;
        }
        
        // 실제 뉴스 기사 URL인지 확인
        if (link.includes('news.naver.com') || link.includes('/news/') || link.includes('article')) {
          const urlKey = link.split('?')[0];
          if (!articles.some(a => {
            const aUrlKey = a.url.split('?')[0];
            return aUrlKey === urlKey || a.title === title;
          })) {
            articles.push({
              title,
              url: link,
              snippet: snippet || '',
              source: source || '네이버 금융',
              publishedAt: date,
            });
          }
        }
      }
    });
    
    console.log(`[네이버 금융] dl 구조로 ${articles.length}개 발견`);
    
    // 추가 셀렉터 시도 (.articleSubject 등)
    if (articles.length < 10) {
      $('.articleSubject, .newsList li').each((index, element) => {
        if (articles.length >= 30) return false;

        const $el = $(element);
        const $titleEl = $el.find('a').first();
        const title = $titleEl.text().trim() || $titleEl.attr('title') || '';
        let link = $titleEl.attr('href') || '';
        const snippet = $el.find('.summary, .articleSummary, dd').text().trim();
        const source = $el.find('.press, .press_name').text().trim();
        const date = $el.find('.date, .wdate').text().trim();

        if (title && link && title.length > 5) {
          if (link.startsWith('http')) {
            // 이미 절대 경로
          } else if (link.startsWith('/')) {
            link = `https://finance.naver.com${link}`;
          } else {
            link = `https://finance.naver.com/${link}`;
          }
          
          if (link.includes('news.naver.com') || link.includes('/news/') || link.includes('article')) {
            const urlKey = link.split('?')[0];
            if (!articles.some(a => a.url.split('?')[0] === urlKey || a.title === title)) {
              articles.push({
                title,
                url: link,
                snippet: snippet || '',
                source: source || '네이버 금융',
                publishedAt: date,
              });
            }
          }
        }
      });
    }

    console.log(`✅ 네이버 금융에서 ${articles.length}개의 뉴스를 수집했습니다.`);
    return articles.slice(0, 30);
  } catch (error) {
    console.error('[네이버 금융] 크롤링 오류:', error);
    if (error instanceof Error) {
      console.error('[네이버 금융] 오류 상세:', error.message, error.stack);
    }
    return [];
  }
}

/**
 * 네이버 뉴스 검색에서 경제 뉴스 크롤링
 */
export async function crawlNaverEconomyNews(searchQuery: string = '경제'): Promise<NewsArticle[]> {
  try {
    // 네이버 경제 뉴스 검색 URL (최신순 정렬)
    // sort=1: 최신순, sort=0: 관련도순
    // start=1: 첫 페이지부터 시작 (더 많은 결과)
    const searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(searchQuery + ' 경제')}&sm=tab_jum&sort=1&start=1`;
    
    console.log(`[네이버] 크롤링 시작: ${searchUrl}`);
    
    // 타임아웃 설정 (15초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    let response;
    try {
      response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.naver.com/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[네이버] 요청 타임아웃 (8초 초과)');
        throw new Error('네이버 뉴스 크롤링 타임아웃');
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error(`[네이버] HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      console.error('[네이버] HTML 응답이 비어있거나 너무 짧습니다.');
      return [];
    }
    
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // 네이버 뉴스 검색 결과 파싱 (정확한 셀렉터 사용)
    console.log(`[네이버] HTML 파싱 시작 (길이: ${html.length})`);
    
    $('.news_area').each((index, element) => {
      if (articles.length >= 30) return false;

      const $el = $(element);
      
      // 제목 추출
      const titleEl = $el.find('.news_tit');
      const title = titleEl.attr('title') || titleEl.text().trim();
      
      // 링크 추출
      let link = titleEl.attr('href') || $el.find('a.news_tit').attr('href') || '';
      
      // 출처 추출
      const source = $el.find('.press').text().trim();
      
      // 날짜 추출
      const date = $el.find('.info').last().text().trim();
      
      // snippet 추출
      const snippet = $el.find('.news_dsc, .dsc_wrap, .api_txt_lines').text().trim();

      // 필터링: 실제 뉴스 기사만 (메인 페이지 제외)
      if (title && link && title.length > 5) {
        // 메인 페이지나 쓸모없는 링크 제외
        if (link.includes('naver.com/main') || 
            link.includes('naver.com/') && !link.includes('/news/')) {
          return;
        }
        
        // 네이버 뉴스 링크 정규화
        if (link.startsWith('http')) {
          // 이미 절대 경로
        } else if (link.startsWith('/')) {
          link = `https://search.naver.com${link}`;
        } else if (link.startsWith('./')) {
          link = `https://search.naver.com${link.substring(1)}`;
        } else {
          link = `https://search.naver.com/${link}`;
        }
        
        // 실제 뉴스 기사 URL인지 확인 (news.naver.com 포함)
        if (!link.includes('news.naver.com') && !link.includes('news/')) {
          return;
        }

        // 중복 체크
        const urlKey = link.split('?')[0]; // 쿼리 파라미터 제거
        if (!articles.some(a => {
          const aUrlKey = a.url.split('?')[0];
          return aUrlKey === urlKey || a.title === title;
        })) {
          articles.push({
            title,
            url: link,
            snippet: snippet || '',
            source: source || '네이버 뉴스',
            publishedAt: date,
          });
        }
      }
    });
    
    console.log(`[네이버] .news_area로 ${articles.length}개 발견`);
    
    // .news_area로 충분하지 않으면 추가 셀렉터 시도
    if (articles.length < 30) {
      console.log(`[네이버] 추가 셀렉터 시도 (현재: ${articles.length}개, 목표: 30개)`);
      
      // 추가 셀렉터 1: .news_wrap, .news_info
      $('.news_wrap, .news_info').each((index, element) => {
        if (articles.length >= 30) return false;

        const $el = $(element);
        const titleEl = $el.find('.news_tit, a.news_tit');
        const title = titleEl.attr('title') || titleEl.text().trim();
        let link = titleEl.attr('href') || '';
        const source = $el.find('.press, .info_group .press').text().trim();
        const snippet = $el.find('.news_dsc, .dsc_wrap').text().trim();

        if (title && link && title.length > 5 && !link.includes('naver.com/main')) {
          if (link.startsWith('http')) {
            // 이미 절대 경로
          } else if (link.startsWith('/')) {
            link = `https://search.naver.com${link}`;
          } else {
            link = `https://search.naver.com/${link}`;
          }
          
          if (link.includes('news.naver.com') || link.includes('news/')) {
            const urlKey = link.split('?')[0];
            if (!articles.some(a => a.url.split('?')[0] === urlKey || a.title === title)) {
              articles.push({
                title,
                url: link,
                snippet: snippet || '',
                source: source || '네이버 뉴스',
              });
            }
          }
        }
      });
      
      // 추가 셀렉터 2: .api_subject_bx, .news_contents
      if (articles.length < 30) {
        console.log(`[네이버] 추가 셀렉터 2 시도 (현재: ${articles.length}개)`);
        $('.api_subject_bx, .news_contents, .news_item').each((index, element) => {
          if (articles.length >= 30) return false;
          
          const $el = $(element);
          const titleEl = $el.find('a, .title, .news_tit');
          const title = titleEl.attr('title') || titleEl.text().trim();
          let link = titleEl.attr('href') || $el.find('a').first().attr('href') || '';
          const source = $el.find('.press, .info_group .press, .press_name').text().trim();
          const snippet = $el.find('.news_dsc, .dsc_wrap, .summary').text().trim();
          const date = $el.find('.info, .date').last().text().trim();
          
          if (title && link && title.length > 5 && !link.includes('naver.com/main')) {
            if (link.startsWith('http')) {
              // 이미 절대 경로
            } else if (link.startsWith('/')) {
              link = `https://search.naver.com${link}`;
            } else {
              link = `https://search.naver.com/${link}`;
            }
            
            if (link.includes('news.naver.com') || link.includes('news/')) {
              const urlKey = link.split('?')[0];
              if (!articles.some(a => a.url.split('?')[0] === urlKey || a.title === title)) {
                articles.push({
                  title,
                  url: link,
                  snippet: snippet || '',
                  source: source || '네이버 뉴스',
                  publishedAt: date,
                });
              }
            }
          }
        });
      }
    }

    console.log(`✅ 네이버에서 ${articles.length}개의 뉴스를 수집했습니다.`);
    if (articles.length === 0) {
      console.warn('[네이버] 뉴스를 찾을 수 없습니다. HTML 구조가 변경되었을 수 있습니다.');
      // 디버깅을 위해 HTML 일부 출력
      const bodyText = $('body').text().substring(0, 500);
      console.log('[네이버] HTML 본문 일부:', bodyText);
    }
    return articles.slice(0, 30);
  } catch (error) {
    console.error('[네이버] 크롤링 오류:', error);
    if (error instanceof Error) {
      console.error('[네이버] 오류 상세:', error.message, error.stack);
    }
    return [];
  }
}

/**
 * Google News에서 키워드 검색 크롤링 (최신순)
 */
export async function crawlGoogleNews(searchQuery: string = '주식'): Promise<NewsArticle[]> {
  try {
    // Google News 검색 URL (최신순 정렬, 한국어)
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery + ' 증시')}&hl=ko&gl=KR&ceid=KR:ko&when=7d`;
    
    console.log(`[Google News] 크롤링 시작: ${searchUrl}`);
    
    // 타임아웃 설정 (15초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    let response;
    try {
      response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[Google News] 요청 타임아웃 (15초 초과)');
        throw new Error('Google News 크롤링 타임아웃');
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error(`[Google News] HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      console.error('[Google News] HTML 응답이 비어있거나 너무 짧습니다.');
      return [];
    }
    
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
    if (articles.length === 0) {
      console.warn('[Google News] 뉴스를 찾을 수 없습니다. HTML 구조가 변경되었을 수 있습니다.');
      const articleCount = $('article').length;
      console.log(`[Google News] 발견된 article 태그: ${articleCount}개`);
    }
    return articles.slice(0, 30);
  } catch (error) {
    console.error('[Google News] 크롤링 오류:', error);
    if (error instanceof Error) {
      console.error('[Google News] 오류 상세:', error.message, error.stack);
    }
    return []; // 에러 발생 시 빈 배열 반환 (throw 대신)
  }
}

/**
 * 다음 뉴스에서 키워드 검색 크롤링
 */
export async function crawlDaumNews(searchQuery: string): Promise<NewsArticle[]> {
  try {
    const searchUrl = `https://search.daum.net/search?w=news&q=${encodeURIComponent(searchQuery + ' 증시')}&sort=recency`;
    
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
    return articles.slice(0, 30);
  } catch (error) {
    console.error('다음 뉴스 크롤링 오류:', error);
    return [];
  }
}

/**
 * 구글과 네이버에서 경제 뉴스 크롤링 (통합)
 * 검색 날짜 기준 최신 기사 10개 수집
 */
// Rate Limiting: 요청 간격을 두기 위한 헬퍼 함수
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function crawlStockNews(searchQuery: string = '주식'): Promise<NewsArticle[]> {
  try {
    const allArticles: NewsArticle[] = [];
    const existingUrls = new Set<string>();
    const existingTitles = new Set<string>();

    // 주식 뉴스는 기본적으로 증시 관련 키워드 추가
    const enhancedQuery = searchQuery.includes('주식') || searchQuery.includes('증시') 
      ? searchQuery 
      : `${searchQuery} 주식`;

    console.log(`[통합 크롤링] 시작: "${enhancedQuery}"`);

    // 1. 네이버 금융 증시 뉴스 페이지 크롤링 (우선)
    try {
      console.log(`🔍 [1/3] 네이버 금융 증시 뉴스 크롤링`);
      const financeArticles = await crawlNaverFinanceNews();
      console.log(`[네이버 금융] ${financeArticles.length}개 수집 완료`);
      
      for (const article of financeArticles) {
        if (allArticles.length >= 30) break;
        const urlKey = article.url.split('?')[0];
        if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
          allArticles.push(article);
          existingUrls.add(urlKey);
          existingTitles.add(article.title);
        }
      }
      await delay(1000); // Rate Limiting
    } catch (error) {
      console.error('[네이버 금융] 크롤링 실패:', error);
      if (error instanceof Error) {
        console.error('[네이버 금융] 오류 상세:', error.message);
      }
    }

    // 2. 네이버 뉴스 검색 크롤링 (주식+증시)
    if (allArticles.length < 10) {
      try {
        console.log(`🔍 [2/3] 네이버 뉴스 검색 크롤링: ${enhancedQuery}`);
        const naverArticles = await crawlNaverStockNews(enhancedQuery);
        console.log(`[네이버 검색] ${naverArticles.length}개 수집 완료`);
        
        for (const article of naverArticles) {
          if (allArticles.length >= 30) break;
          const urlKey = article.url.split('?')[0];
          if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
            allArticles.push(article);
            existingUrls.add(urlKey);
            existingTitles.add(article.title);
          }
        }
        await delay(1000); // Rate Limiting
      } catch (error) {
        console.error('[네이버 검색] 크롤링 실패:', error);
        if (error instanceof Error) {
          console.error('[네이버 검색] 오류 상세:', error.message);
        }
      }
    }

    // 3. Google News 크롤링 (추가 뉴스가 필요한 경우)
    if (allArticles.length < 10) {
      try {
        console.log(`🔍 [3/3] Google News 크롤링: ${enhancedQuery}`);
        const googleArticles = await crawlGoogleNews(enhancedQuery);
        console.log(`[Google News] ${googleArticles.length}개 수집 완료`);
        
        for (const article of googleArticles) {
          if (allArticles.length >= 30) break;
          const urlKey = article.url.split('?')[0];
          if (!existingUrls.has(urlKey) && !existingTitles.has(article.title)) {
            allArticles.push(article);
            existingUrls.add(urlKey);
            existingTitles.add(article.title);
          }
        }
      } catch (error) {
        console.error('[Google News] 크롤링 실패:', error);
        if (error instanceof Error) {
          console.error('[Google News] 오류 상세:', error.message);
        }
      }
    }

    console.log(`✅ [통합 크롤링] 총 ${allArticles.length}개의 뉴스를 수집했습니다.`);
    
    if (allArticles.length === 0) {
      console.warn('⚠️ [통합 크롤링] 모든 소스에서 뉴스를 찾을 수 없습니다.');
    }
    
    return allArticles.slice(0, 30);
  } catch (error) {
    console.error('❌ [통합 크롤링] 오류:', error);
    if (error instanceof Error) {
      console.error('❌ [통합 크롤링] 오류 상세:', error.message, error.stack);
    }
    return [];
  }
}

// 하위 호환성을 위해 crawlEconomyNews도 유지 (crawlStockNews로 리다이렉트)
export async function crawlEconomyNews(searchQuery: string = '주식'): Promise<NewsArticle[]> {
  return crawlStockNews(searchQuery);
}

/**
 * 뉴스 기사 본문 내용 추출
 */
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    console.log(`[본문 추출] 시작: ${url}`);
    
    // 타임아웃 설정 (8초로 단축 - 여러 기사 처리 시 시간 절약)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[본문 추출] 타임아웃: ${url}`);
        return '';
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error(`[본문 추출] HTTP 오류: ${response.status} ${response.statusText} - ${url}`);
      return '';
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      console.warn(`[본문 추출] HTML이 비어있거나 너무 짧음: ${url}`);
      return '';
    }
    
    const $ = cheerio.load(html);
    
    // 다양한 뉴스 사이트 구조에 맞게 본문 추출
    let content = '';
    
    // 네이버 뉴스
    const naverSelectors = [
      '.go_trans._article_content',
      '#articleBodyContents',
      '.article_body',
      '#newsEndContents',
      '.news_end_body',
    ];
    for (const selector of naverSelectors) {
      content = $(selector).first().text().trim();
      if (content && content.length > 50) break;
    }
    
    // 일반적인 뉴스 사이트
    if (!content || content.length < 50) {
      const generalSelectors = [
        'article .article-body',
        'article .post-content',
        '.article-body',
        '.post-content',
        '.news-content',
        '.content',
        '.article_view',
        '[class*="article"]',
        '[class*="content"]',
      ];
      for (const selector of generalSelectors) {
        content = $(selector).first().text().trim();
        if (content && content.length > 50) break;
      }
    }
    
    // 최후의 수단: article 태그 또는 main 태그
    if (!content || content.length < 50) {
      content = $('article, main').first().text().trim();
    }
    
    // 그래도 없으면 body에서 스크립트 제거
    if (!content || content.length < 50) {
      $('script, style, nav, header, footer, .ad, .advertisement, .ad-banner').remove();
      content = $('body').text().trim();
    }

    // 공백 정리
    content = content.replace(/\s+/g, ' ').trim();
    
    if (content && content.length > 50) {
      console.log(`[본문 추출] 성공: ${content.length}자 - ${url}`);
    } else {
      console.warn(`[본문 추출] 본문이 너무 짧거나 없음: ${url}`);
    }
    
    return content || '';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[본문 추출] 타임아웃: ${url}`);
    } else {
      console.error(`[본문 추출] 오류: ${url}`, error);
      if (error instanceof Error) {
        console.error(`[본문 추출] 오류 상세:`, error.message);
      }
    }
    return '';
  }
}

/**
 * kokstock.com에서 공모주 일정 크롤링
 */
export async function crawlKokStockIPO(): Promise<NewsArticle[]> {
  try {
    const url = 'https://www.kokstock.com/stock/ipo.asp';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.kokstock.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: NewsArticle[] = [];

    // 테이블에서 공모주 일정 추출 (다양한 테이블 구조 지원)
    const tableSelectors = [
      'table tr',
      'table tbody tr',
      '.table tr',
      'table[class*="ipo"] tr',
    ];

    for (const selector of tableSelectors) {
      $(selector).each((index, element) => {
        if (articles.length >= 30) return false;

        const $row = $(element);
        const cells = $row.find('td, th');
        
        if (cells.length < 2) return;

        // 첫 번째 셀: 청약일정 (예: 02.20 ~ 02.23)
        let scheduleText = cells.eq(0).text().trim();
        
        // 두 번째 셀: 종목명 (링크가 있을 수 있음)
        const stockNameEl = cells.eq(1).find('a').first();
        let stockName = stockNameEl.text().trim() || cells.eq(1).text().trim();
        
        // 세 번째 셀: 주관사
        const underwriter = cells.length > 2 ? cells.eq(2).text().trim() : '';
        
        // 네 번째 셀: 설명
        const description = cells.length > 3 ? cells.eq(3).text().trim() : '';

        // 날짜 형식이 다른 경우 처리 (예: 2026.02.20 ~ 2026.02.23)
        if (!scheduleText.match(/\d{2}\.\d{2}/) && scheduleText.match(/\d{4}\.\d{2}\.\d{2}/)) {
          const fullDateMatch = scheduleText.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/);
          if (fullDateMatch) {
            const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = fullDateMatch;
            scheduleText = `${startYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일 ~ ${endYear}년 ${parseInt(endMonth)}월 ${parseInt(endDay)}일`;
          }
        }

        if (scheduleText && stockName && stockName.length > 1 && !stockName.includes('청약일정')) {
          // 날짜 파싱 (02.20 ~ 02.23 형식)
          const dateMatch = scheduleText.match(/(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})/);
          let formattedSchedule = scheduleText;
          
          if (dateMatch) {
            const [, startMonth, startDay, endMonth, endDay] = dateMatch;
            const now = new Date();
            const currentYear = now.getFullYear();
            formattedSchedule = `${currentYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일 ~ ${currentYear}년 ${parseInt(endMonth)}월 ${parseInt(endDay)}일 청약`;
          }

          // 제목 생성
          const title = `${stockName} 공모주 ${formattedSchedule}`;
          
          // URL 생성
          const stockLink = stockNameEl.attr('href') || stockNameEl.attr('onclick');
          let articleUrl = url;
          if (stockLink && stockLink.startsWith('http')) {
            articleUrl = stockLink;
          } else if (stockLink && stockLink.includes('popStockIPO')) {
            // JavaScript 함수 호출이면 원본 URL 사용
            articleUrl = url;
          }

          // 중복 체크
          if (!articles.some(a => a.title === title)) {
            articles.push({
              title,
              url: articleUrl,
              snippet: `${stockName} 공모주 청약일정: ${formattedSchedule}. ${underwriter ? `주관사: ${underwriter}. ` : ''}${description.substring(0, 150)}`,
              source: 'kokstock.com',
            });
          }
        }
      });

      if (articles.length > 0) break; // 첫 번째로 성공한 셀렉터 사용
    }

    console.log(`✅ kokstock.com에서 ${articles.length}개의 공모주 일정을 수집했습니다.`);
    return articles;
  } catch (error) {
    console.error('kokstock.com 크롤링 오류:', error);
    return [];
  }
}

/**
 * 공모주 일정 전용 크롤링 (kokstock.com 포함)
 */
export async function crawlIPOSchedules(): Promise<NewsArticle[]> {
  try {
    const allArticles: NewsArticle[] = [];
    const existingTitles = new Set<string>();

    // 1. kokstock.com 크롤링
    try {
      console.log('🔍 kokstock.com 공모주 일정 크롤링');
      const kokStockArticles = await crawlKokStockIPO();
      
      for (const article of kokStockArticles) {
        if (!existingTitles.has(article.title)) {
          allArticles.push(article);
          existingTitles.add(article.title);
        }
      }
    } catch (error) {
      console.error('kokstock.com 크롤링 실패:', error);
    }

    // 2. 공모주 일정 관련 뉴스 크롤링
    try {
      console.log('🔍 공모주 일정 뉴스 크롤링');
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const scheduleQueries = [
        `${currentYear}년 ${currentMonth}월 공모주 일정`,
        `${currentYear}년 ${currentMonth}월 공모주 청약`,
        '공모주 일정',
        '공모주 청약',
      ];

      for (const query of scheduleQueries.slice(0, 2)) {
        const newsArticles = await crawlEconomyNews(query);
        for (const article of newsArticles) {
          if (allArticles.length >= 30) break;
          if (!existingTitles.has(article.title)) {
            allArticles.push(article);
            existingTitles.add(article.title);
          }
        }
        if (allArticles.length >= 30) break;
      }
    } catch (error) {
      console.error('공모주 일정 뉴스 크롤링 실패:', error);
    }

    console.log(`✅ 총 ${allArticles.length}개의 공모주 일정을 수집했습니다.`);
    return allArticles.slice(0, 30);
  } catch (error) {
    console.error('공모주 일정 크롤링 오류:', error);
    return [];
  }
}
