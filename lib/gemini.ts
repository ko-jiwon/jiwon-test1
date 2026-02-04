import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiSummary } from '@/types';

// 환경 변수 검증
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error(
    'Gemini API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가하세요.'
  );
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

/**
 * 뉴스 기사를 분석하여 핵심 키워드와 핵심 내용을 추출
 * @param newsTitle 뉴스 제목
 * @param newsContent 뉴스 본문 내용
 * @param searchKeyword 검색 키워드 (예: '공모주')
 * @returns 종목명, 청약일정, 핵심 요약, 핵심 키워드
 */
export async function summarizeNews(
  newsTitle: string,
  newsContent: string,
  searchKeyword: string = '공모주'
): Promise<GeminiSummary> {
  try {
    // gemini-1.5-flash 모델 사용
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
다음 뉴스 기사를 분석하여 "${searchKeyword}" 관련 핵심 정보를 추출해주세요.

**중요**: 반드시 JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.

{
  "stock_name": "종목명 또는 주요 키워드 (없으면 '정보 없음')",
  "schedule": "일정 정보 (예: 2024년 2월 15일 청약, 없으면 '정보 없음')",
  "summary": "핵심 내용 요약 (100자 이내, ${searchKeyword} 관련 핵심 정보 포함)",
  "keywords": "핵심 키워드 3-5개 (쉼표로 구분, 예: '공모주, 청약, 상장, 주가, 투자')"
}

뉴스 제목: ${newsTitle}

뉴스 내용:
${newsContent.substring(0, 8000)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = text;
    
    // 마크다운 코드 블록 제거
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    // JSON 파싱
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 필수 필드 검증
      if (!parsed.summary) {
        throw new Error('필수 필드가 누락되었습니다.');
      }
      
      return {
        stock_name: parsed.stock_name || '정보 없음',
        schedule: parsed.schedule || '정보 없음',
        summary: parsed.summary || '요약 정보 없음',
        keywords: parsed.keywords || searchKeyword,
      };
    }
    
    throw new Error('JSON 형식으로 파싱할 수 없습니다.');
  } catch (error) {
    console.error('Gemini API 오류:', error);
    
    // 파싱 오류 시 기본값 반환
    if (error instanceof SyntaxError) {
      throw new Error('Gemini API 응답을 파싱할 수 없습니다.');
    }
    
    throw error;
  }
}
