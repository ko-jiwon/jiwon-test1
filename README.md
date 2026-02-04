# 2월 공모주 정보 요약 및 뉴스 서비스

Next.js(App Router)와 Supabase를 사용한 공모주 정보 요약 및 뉴스 서비스입니다.

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database & Authentication)
- **Gemini API** (뉴스 요약)
- **Cheerio** (웹 크롤링)

## 주요 기능

- 구글 뉴스에서 공모주 관련 기사 크롤링
- Gemini API를 통한 뉴스 내용 구조화 (종목명, 일정, 핵심 요약)
- Supabase에 데이터 저장
- 대시보드 형태의 카드 UI로 결과 표시

## 설치 방법

```bash
npm install
```

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## 실행 방법

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

