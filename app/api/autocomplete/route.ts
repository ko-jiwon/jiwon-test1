import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 검색어 자동완성 API
 * DB 내 종목명 리스트를 반환
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { 
          error: '데이터베이스 연결 설정이 없습니다.',
          suggestions: []
        },
        { status: 500 }
      );
    }

    // 종목명 추출: title에서 종목명 추출 또는 keywords에서 추출
    // 실제로는 더 정교한 파싱이 필요하지만, 기본적으로 title과 keywords를 활용
    const { data, error } = await supabase
      .from('ipo_news')
      .select('title, keywords, stock_name')
      .or(`title.ilike.%${query}%,keywords.ilike.%${query}%,stock_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('자동완성 조회 오류:', error);
      return NextResponse.json(
        { 
          error: '자동완성 데이터를 불러오는 중 오류가 발생했습니다.',
          suggestions: []
        },
        { status: 500 }
      );
    }

    // 종목명 추출 및 중복 제거
    const stockNames = new Set<string>();
    
    (data || []).forEach((item: any) => {
      // stock_name이 있으면 우선 사용
      if (item.stock_name && item.stock_name !== '정보 없음') {
        stockNames.add(item.stock_name.trim());
      }
      
      // title에서 종목명 추출 (간단한 휴리스틱)
      if (item.title) {
        // "OOO 공모주", "OOO 청약" 등의 패턴
        const titleMatch = item.title.match(/^([가-힣a-zA-Z0-9\s]+?)\s*(공모주|청약|상장|IPO)/);
        if (titleMatch && titleMatch[1]) {
          const name = titleMatch[1].trim();
          if (name.length >= 2 && name.length <= 20) {
            stockNames.add(name);
          }
        }
      }
      
      // keywords에서 추출
      if (item.keywords) {
        const keywords = item.keywords.split(',').map((k: string) => k.trim());
        keywords.forEach((keyword: string) => {
          if (keyword.length >= 2 && keyword.length <= 20 && !keyword.includes('공모주') && !keyword.includes('청약')) {
            stockNames.add(keyword);
          }
        });
      }
    });

    // 쿼리로 필터링 및 정렬
    const suggestions = Array.from(stockNames)
      .filter(name => query === '' || name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(name => ({
        name,
        count: 1 // 추후 실제 카운트로 변경 가능
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('자동완성 오류:', error);
    return NextResponse.json(
      { 
        error: '자동완성 중 오류가 발생했습니다.',
        suggestions: []
      },
      { status: 500 }
    );
  }
}

