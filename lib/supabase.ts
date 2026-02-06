import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수 가져오기 (빌드 타임 에러 방지를 위해 throw 하지 않음)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 초기화 (환경 변수가 없어도 빌드는 성공하도록)
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // 서버 사이드에서는 세션 유지 불필요
      },
    });
  } catch (error) {
    console.error('Supabase 클라이언트 초기화 실패:', error);
  }
} else {
  // 빌드 타임에는 에러를 던지지 않고 경고만 출력
  if (typeof window === 'undefined') {
    // 서버 사이드에서만 경고 (빌드 타임)
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. Supabase 기능을 사용할 수 없습니다.');
  }
}

// Supabase 클라이언트 반환 (환경 변수가 없으면 null 반환)
export const supabase = supabaseClient;

// Supabase 사용 가능 여부 확인 함수
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseClient);
}

// 연결 테스트 함수
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return {
      success: false,
      error: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  try {
    const { data, error } = await supabaseClient
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
