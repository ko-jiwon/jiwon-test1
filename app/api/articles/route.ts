import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ipo_news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('기사 조회 오류:', error);
    return NextResponse.json(
      { error: '기사를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

