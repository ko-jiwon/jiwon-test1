# 설치 가이드

## 1. 의존성 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요:

```bash
npm install
```

또는 개별적으로 설치하려면:

```bash
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js cheerio @google/generative-ai lucide-react
npm install -D typescript @types/node @types/react @types/react-dom @types/cheerio
npm install -D tailwindcss postcss autoprefixer eslint eslint-config-next
```

## 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API 설정
GEMINI_API_KEY=your-gemini-api-key
```

### Supabase 설정 방법

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 설정 > API에서 URL과 키 확인
3. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 테이블 생성

### Gemini API 키 발급 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. 생성된 키를 `.env.local`에 추가

## 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 4. 빌드 및 배포

```bash
npm run build
npm start
```

