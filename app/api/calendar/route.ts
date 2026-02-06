import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Supabase 설정 확인
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json(
        { 
          error: '데이터베이스 연결 설정이 없습니다.',
          schedules: []
        },
        { status: 500 }
      );
    }

    // schedule이 있는 항목만 조회
    let query = supabase
      .from('ipo_news')
      .select('*')
      .not('schedule', 'is', null)
      .neq('schedule', '정보 없음')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase 쿼리 오류:', error);
      return NextResponse.json(
        { 
          error: '일정을 불러오는 중 오류가 발생했습니다.',
          schedules: []
        },
        { status: 500 }
      );
    }

    // 필터링 (필요시)
    let filteredData = data || [];
    
    if (filter === 'demand') {
      filteredData = filteredData.filter(item => 
        item.schedule?.includes('수요예측') || item.schedule?.includes('수요')
      );
    } else if (filter === 'subscription') {
      filteredData = filteredData.filter(item => 
        item.schedule?.includes('청약') || item.schedule?.includes('청약중')
      );
    } else if (filter === 'listing') {
      filteredData = filteredData.filter(item => 
        item.schedule?.includes('상장') || item.schedule?.includes('상장예정')
      );
    }

    console.log(`✅ ${filteredData.length}개의 일정을 조회했습니다.`);
    return NextResponse.json({ schedules: filteredData || [] });
  } catch (error) {
    console.error('일정 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '일정을 불러오는 중 오류가 발생했습니다.',
        schedules: []
      },
      { status: 500 }
    );
  }
}

