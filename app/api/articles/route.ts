import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: '데이터베이스 연결 설정이 없습니다.',
          details: 'Vercel 환경 변수에서 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.',
          articles: []
        },
        { status: 500 }
      );
    }

    // 최신순으로 정렬하여 최대 10개만 조회
    const { data, error } = await supabase
      .from('ipo_news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase 쿼리 오류:', error);
      
      // 테이블이 없는 경우
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: '데이터베이스 테이블이 없습니다.',
            details: 'Supabase에서 ipo_news 테이블을 생성해주세요.',
            articles: []
          },
          { status: 404 }
        );
      }

      // 권한 오류
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        return NextResponse.json(
          { 
            error: '데이터베이스 접근 권한이 없습니다.',
            details: 'Supabase RLS 정책을 확인해주세요.',
            articles: []
          },
          { status: 403 }
        );
      }

      throw error;
    }

    console.log(`✅ ${data?.length || 0}개의 기사를 조회했습니다. (최신순, 최대 10개)`);
    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('기사 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    return NextResponse.json(
      { 
        error: '기사를 불러오는 중 오류가 발생했습니다.',
        details: errorMessage,
        articles: []
      },
      { status: 500 }
    );
  }
}
