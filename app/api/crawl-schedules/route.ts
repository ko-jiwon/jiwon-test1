import { NextRequest, NextResponse } from 'next/server';
import { crawlEconomyNews, fetchArticleContent } from '@/lib/crawler';
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
    
    // 공모주 일정 관련 검색어들
    const searchQueries = [
      `${currentYear}년 ${currentMonth}월 공모주`,
      `${currentYear}년 ${currentMonth}월 공모주 일정`,
      `${currentYear}년 ${currentMonth}월 공모주 청약`,
      `${currentYear}년 ${currentMonth}월 공모주 상장`,
      '공모주 일정',
      '공모주 청약',
    ];

    let totalSaved = 0;
    const allErrors: string[] = [];

    // 각 검색어로 크롤링
    for (const searchQuery of searchQueries.slice(0, 3)) { // 최대 3개 검색어만 사용
      try {
        console.log(`🔍 공모주 일정 크롤링 시작: "${searchQuery}"`);

        // 1. 뉴스 크롤링
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

            // 이번달 일정인지 확인
            const scheduleText = summary.schedule;
            const isCurrentMonth = 
              scheduleText.includes(`${currentYear}년 ${currentMonth}월`) ||
              scheduleText.includes(`${currentYear}년 ${currentMonth}일`);

            if (!isCurrentMonth) {
              continue; // 이번달 일정이 아니면 스킵
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
              // 업데이트
              await supabase
                .from('ipo_news')
                .update(newsData)
                .eq('link', article.url);
            } else {
              // 삽입
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

