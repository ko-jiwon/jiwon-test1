import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Supabase 설정 확인
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json(
        { 
          error: '데이터베이스 연결 설정이 없습니다.',
          ipo: null,
          relatedNews: []
        },
        { status: 500 }
      );
    }

    // IPO 정보 조회
    const { data: ipoData, error: ipoError } = await supabase
      .from('ipo_news')
      .select('*')
      .eq('id', id)
      .single();

    if (ipoError || !ipoData) {
      return NextResponse.json(
        { 
          error: 'IPO 정보를 찾을 수 없습니다.',
          ipo: null,
          relatedNews: []
        },
        { status: 404 }
      );
    }

    // 관련 뉴스 조회 (같은 종목명 또는 유사한 키워드)
    const stockName = ipoData.title;
    const keywords = ipoData.keywords?.split(',').map(k => k.trim()) || [];
    
    let relatedQuery = supabase
      .from('ipo_news')
      .select('*')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 종목명이나 키워드로 필터링
    if (stockName && stockName !== '정보 없음') {
      relatedQuery = relatedQuery.or(
        `title.ilike.%${stockName}%,summary.ilike.%${stockName}%`
      );
    }

    const { data: relatedNews } = await relatedQuery;

    return NextResponse.json({
      ipo: ipoData,
      relatedNews: relatedNews || []
    });
  } catch (error) {
    console.error('IPO 정보 조회 오류:', error);
    return NextResponse.json(
      { 
        error: 'IPO 정보를 불러오는 중 오류가 발생했습니다.',
        ipo: null,
        relatedNews: []
      },
      { status: 500 }
    );
  }
}

