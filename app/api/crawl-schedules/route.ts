import { NextRequest, NextResponse } from 'next/server';
import { crawlEconomyNews, fetchArticleContent, crawlIPOSchedules } from '@/lib/crawler';
import { summarizeNews } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { IPONews } from '@/types';

/**
 * 공모주 일정 전용 크롤링 API
 * POST /api/crawl-schedules
 * 
 * 공모주 일정 관련 뉴스를 크롤링하여 일정 정보를 추출합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { 
          error: '데이터베이스 연결 설정이 없습니다.',
          savedCount: 0
        },
        { status: 500 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Gemini API 키가 설정되지 않았습니다.',
          savedCount: 0
        },
        { status: 500 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let totalSaved = 0;
    const allErrors: string[] = [];

    // 1. kokstock.com 및 공모주 일정 전용 크롤링
    try {
      console.log('🔍 kokstock.com 및 공모주 일정 크롤링 시작');
      const scheduleArticles = await crawlIPOSchedules();
      
      console.log(`✅ ${scheduleArticles.length}개의 공모주 일정을 수집했습니다.`);

      // 일정 정보가 이미 포함된 기사들은 바로 저장
      for (const article of scheduleArticles) {
        try {
          // kokstock.com 기사는 이미 일정 정보가 포함되어 있음
          const isKokStock = article.source === 'kokstock.com';
          
          let summary;
          if (isKokStock) {
            // kokstock.com 기사는 snippet에서 일정 정보 추출
            const scheduleMatch = article.snippet.match(/(\d{4}년 \d{1,2}월 \d{1,2}일.*?청약)/);
            const stockMatch = article.title.match(/(.+?)\s+공모주/);
            
            summary = {
              stock_name: stockMatch ? stockMatch[1] : article.title.split(' ')[0],
              schedule: scheduleMatch ? scheduleMatch[1] : article.snippet.split('청약일정:')[1]?.split('.')[0] || '정보 없음',
              summary: article.snippet,
              keywords: '공모주, 청약, 일정',
            };
          } else {
            // 일반 뉴스는 본문 가져와서 분석
            const articleContent = await fetchArticleContent(article.url);
            try {
              summary = await summarizeNews(
                article.title,
                articleContent || article.snippet || article.title,
                '공모주 일정'
              );
            } catch (geminiError) {
              console.error(`❌ Gemini API 오류:`, geminiError);
              continue;
            }
          }

          // 일정 정보가 있는 경우만 저장
          if (!summary.schedule || summary.schedule === '정보 없음') {
            continue;
          }

          // 이번달 일정인지 확인
          const scheduleText = summary.schedule;
          const isCurrentMonth = 
            scheduleText.includes(`${currentYear}년 ${currentMonth}월`) ||
            scheduleText.includes(`${currentYear}년 ${currentMonth}일`);

          if (!isCurrentMonth && !isKokStock) {
            continue; // kokstock.com은 모든 일정 저장
          }

          // DB에 저장
          const newsData: Omit<IPONews, 'id' | 'created_at'> = {
            title: summary.stock_name || article.title.substring(0, 200),
            summary: summary.summary || article.snippet || '요약 정보 없음',
            schedule: summary.schedule,
            ...(summary.keywords ? { keywords: summary.keywords } : {}),
            link: article.url,
          };

          // 중복 체크
          const { data: existing } = await supabase
            .from('ipo_news')
            .select('id')
            .eq('link', article.url)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('ipo_news')
              .update(newsData)
              .eq('link', article.url);
          } else {
            await supabase
              .from('ipo_news')
              .insert([newsData]);
          }

          totalSaved++;
          console.log(`✅ 일정 저장: ${summary.stock_name} - ${summary.schedule}`);
        } catch (articleError) {
          console.error(`❌ 기사 처리 오류:`, articleError);
          continue;
        }
      }
    } catch (scheduleError) {
      console.error(`❌ 일정 크롤링 오류:`, scheduleError);
      allErrors.push('일정 크롤링 실패');
    }

    // 2. 공모주 뉴스 크롤링 (일반 뉴스)
    const searchQueries = [
      `${currentYear}년 ${currentMonth}월 공모주`,
      '공모주 뉴스',
      '공모주 주식',
    ];

    for (const searchQuery of searchQueries) {
      try {
        console.log(`🔍 공모주 뉴스 크롤링 시작: "${searchQuery}"`);

        // 뉴스 크롤링
        const newsArticles = await crawlEconomyNews(searchQuery);
        
        if (!newsArticles || newsArticles.length === 0) {
          console.log(`⚠️ "${searchQuery}"에 대한 뉴스가 없습니다.`);
          continue;
        }

        console.log(`✅ ${newsArticles.length}개의 뉴스를 수집했습니다.`);

        // 2. 각 뉴스별로 일정 정보 추출 및 저장
        for (const article of newsArticles) {
          try {
            // 기사 본문 가져오기
            const articleContent = await fetchArticleContent(article.url);
            
            // Gemini API로 일정 정보 추출
            let summary;
            try {
              summary = await summarizeNews(
                article.title,
                articleContent || article.snippet || article.title,
                searchQuery
              );
            } catch (geminiError) {
              console.error(`❌ Gemini API 오류:`, geminiError);
              continue; // 일정 정보 추출 실패 시 스킵
            }

            // 일정 정보가 있는 경우만 저장
            if (!summary.schedule || summary.schedule === '정보 없음') {
              continue;
            }

            // 일정 정보가 있으면 저장 (이번달 필터링은 선택적)
            const scheduleText = summary.schedule;
            const isCurrentMonth = 
              scheduleText.includes(`${currentYear}년 ${currentMonth}월`) ||
              scheduleText.includes(`${currentYear}년 ${currentMonth}일`);

            // 이번달 일정이 아니어도 공모주 뉴스는 저장
            // DB에 저장
            const newsData: Omit<IPONews, 'id' | 'created_at'> = {
              title: summary.stock_name || article.title.substring(0, 200),
              summary: summary.summary || article.snippet || '요약 정보 없음',
              schedule: summary.schedule !== '정보 없음' ? summary.schedule : undefined,
              ...(summary.keywords ? { keywords: summary.keywords } : {}),
              link: article.url,
            };

            // 중복 체크
            const { data: existing } = await supabase
              .from('ipo_news')
              .select('id')
              .eq('link', article.url)
              .maybeSingle();

            if (existing) {
              await supabase
                .from('ipo_news')
                .update(newsData)
                .eq('link', article.url);
            } else {
              await supabase
                .from('ipo_news')
                .insert([newsData]);
            }

            totalSaved++;
            console.log(`✅ 뉴스 저장: ${summary.stock_name || article.title}`);
          } catch (articleError) {
            console.error(`❌ 기사 처리 오류:`, articleError);
            continue;
          }
        }
      } catch (queryError) {
        console.error(`❌ 검색어 "${searchQuery}" 크롤링 오류:`, queryError);
        allErrors.push(`검색어 "${searchQuery}" 실패`);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `공모주 일정 ${totalSaved}개를 수집했습니다.`,
      savedCount: totalSaved,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    console.error('❌ 일정 크롤링 API 오류:', error);
    return NextResponse.json(
      { 
        error: '일정 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        savedCount: 0
      },
      { status: 500 }
    );
  }
}

