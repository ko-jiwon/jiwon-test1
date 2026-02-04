import { NextRequest, NextResponse } from 'next/server';
import { crawlGoogleNews, fetchArticleContent } from '@/lib/crawler';
import { summarizeNews } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { IPONews } from '@/types';

/**
 * 공모주 뉴스 크롤링 및 요약 API
 * POST /api/crawl
 * 
 * 구글 뉴스에서 '2월 공모주' 키워드로 최신 뉴스 10개를 크롤링하고,
 * Gemini 1.5 Flash로 요약한 후 Supabase에 저장합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 구글 뉴스에서 '2월 공모주' 키워드로 최신 뉴스 10개 크롤링
    console.log('구글 뉴스 크롤링 시작...');
    let newsArticles;
    try {
      newsArticles = await crawlGoogleNews('2월 공모주');
    } catch (error) {
      console.error('크롤링 오류:', error);
      return NextResponse.json(
        { 
          error: '뉴스 크롤링 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : '알 수 없는 오류'
        },
        { status: 500 }
      );
    }

    if (!newsArticles || newsArticles.length === 0) {
      return NextResponse.json(
        { 
          error: '크롤링된 뉴스가 없습니다.',
          message: '데이터 수집 및 요약 완료 (수집된 뉴스 없음)'
        },
        { status: 404 }
      );
    }

    console.log(`${newsArticles.length}개의 뉴스를 수집했습니다.`);

    // 2. 각 뉴스별로 AI 요약 및 DB 저장
    let savedCount = 0;
    let processedCount = 0;

    for (const article of newsArticles) {
      try {
        processedCount++;
        console.log(`[${processedCount}/${newsArticles.length}] 처리 중: ${article.title}`);

        // 2-1. 기사 본문 가져오기
        const articleContent = await fetchArticleContent(article.url);
        
        // 2-2. Gemini API로 요약 (종목명, 청약일정, 핵심 요약 추출)
        let summary;
        try {
          summary = await summarizeNews(
            article.title,
            articleContent || article.snippet || article.title
          );
        } catch (geminiError) {
          console.error(`Gemini API 오류 (${article.url}):`, geminiError);
          // Gemini API 실패 시 기본값 사용
          summary = {
            stock_name: article.title.substring(0, 50) || '정보 없음',
            schedule: '정보 없음',
            summary: article.snippet || article.title.substring(0, 100) || '요약 정보 없음',
          };
        }

        // 2-3. DB에 upsert (link 기준으로 중복 체크)
        // schedule이 유효한 값일 때만 포함
        const newsData: Omit<IPONews, 'id' | 'created_at'> = {
          title: summary.stock_name || article.title.substring(0, 200),
          summary: summary.summary || article.snippet || '요약 정보 없음',
          ...(summary.schedule && summary.schedule !== '정보 없음' 
            ? { schedule: summary.schedule } 
            : {}),
          link: article.url,
        };

        // 중복 체크: link가 이미 존재하는지 확인
        const { data: existing, error: checkError } = await supabase
          .from('ipo_news')
          .select('id')
          .eq('link', article.url)
          .maybeSingle();

        let upsertedData;
        let upsertError;

        if (existing) {
          // 이미 존재하면 업데이트
          const { data, error } = await supabase
            .from('ipo_news')
            .update(newsData)
            .eq('link', article.url)
            .select()
            .single();
          upsertedData = data;
          upsertError = error;
        } else {
          // 없으면 삽입
          const { data, error } = await supabase
            .from('ipo_news')
            .insert([newsData])
            .select()
            .single();
          upsertedData = data;
          upsertError = error;
        }

        if (upsertError) {
          console.error(`DB 저장 오류 (${article.url}):`, upsertError);
          continue;
        }

        if (upsertedData) {
          savedCount++;
          console.log(`✓ 저장 성공: ${upsertedData.title} (${savedCount}/${newsArticles.length})`);
        }
      } catch (articleError) {
        console.error(`기사 처리 오류 (${article.url}):`, articleError);
        continue; // 개별 기사 오류는 계속 진행
      }
    }

    // 3. 완료 메시지 반환
    console.log(`작업 완료: ${savedCount}개의 뉴스가 저장되었습니다.`);
    
    return NextResponse.json({
      success: true,
      message: '데이터 수집 및 요약 완료',
      savedCount,
      totalCrawled: newsArticles.length,
      processedCount,
    });
  } catch (error) {
    console.error('API 전체 오류:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        message: '데이터 수집 및 요약 실패'
      },
      { status: 500 }
    );
  }
}

