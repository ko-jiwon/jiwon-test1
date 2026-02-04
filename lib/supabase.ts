import { createClient } from '@supabase/supabase-js';

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 확인 (더 상세한 에러 메시지)
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  throw new Error(
    'Supabase URL이 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
  );
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  throw new Error(
    'Supabase Anon Key가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
  );
}

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 서버 사이드에서는 세션 유지 불필요
  },
});

// 연결 테스트 함수
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ipo_news')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase 연결 테스트 실패:', error);
      return {
        success: false,
        error: error.message || 'Supabase 연결에 실패했습니다.',
      };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('Supabase 연결 테스트 중 예외 발생:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
