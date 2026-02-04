# 환경 변수 설정 가이드

## 1. .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요.

```bash
# 프로젝트 루트에서 실행
touch .env.local
```

또는 직접 파일을 생성하고 아래 내용을 복사하세요.

## 2. 환경 변수 입력

`.env.local` 파일에 다음 내용을 입력하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini API 설정
GEMINI_API_KEY=
```

## 3. Supabase 설정 값 가져오기

### 3.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 회원가입/로그인
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전 선택 후 생성

### 3.2 API 키 확인

1. Supabase 대시보드에서 프로젝트 선택
2. 좌측 메뉴에서 **Settings** (⚙️) 클릭
3. **API** 메뉴 선택
4. 다음 값들을 복사:

   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`에 입력
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 입력
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`에 입력

   예시:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3.3 데이터베이스 테이블 생성

1. Supabase 대시보드에서 **SQL Editor** 메뉴 선택
2. `supabase/schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣기
3. **Run** 버튼 클릭하여 실행

   또는 직접 다음 SQL 실행:

   ```sql
   -- 공모주 기사 테이블 생성
   CREATE TABLE IF NOT EXISTS ipo_articles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     stock_name TEXT NOT NULL,
     schedule TEXT,
     summary TEXT NOT NULL,
     source_url TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 인덱스 생성
   CREATE INDEX IF NOT EXISTS idx_ipo_articles_stock_name ON ipo_articles(stock_name);
   CREATE INDEX IF NOT EXISTS idx_ipo_articles_created_at ON ipo_articles(created_at DESC);
   CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_articles_source_url ON ipo_articles(source_url);
   ```

4. **Table Editor**에서 `ipo_articles` 테이블이 생성되었는지 확인

## 4. Gemini API 키 발급

### 4.1 Google AI Studio 접속

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인

### 4.2 API 키 생성

1. "Create API Key" 버튼 클릭
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. 생성된 API 키를 복사

### 4.3 .env.local에 추가

```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 5. 최종 .env.local 파일 예시

모든 값을 입력한 후 파일은 다음과 같이 보여야 합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gemini API 설정
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 6. 설정 확인

환경 변수를 설정한 후 개발 서버를 재시작하세요:

```bash
# 개발 서버 중지 (Ctrl + C)
# 다시 시작
npm run dev
```

서버가 정상적으로 시작되면 환경 변수가 올바르게 설정된 것입니다.

## 7. 문제 해결

### 환경 변수를 읽지 못하는 경우

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt` 아님)
- 개발 서버를 재시작했는지 확인
- 변수 이름에 오타가 없는지 확인 (대소문자 구분)

### Supabase 연결 오류

- Supabase 프로젝트가 활성화되어 있는지 확인
- API 키가 올바르게 복사되었는지 확인 (앞뒤 공백 없음)
- 테이블이 생성되었는지 확인 (Table Editor에서 확인)

### Gemini API 오류

- API 키가 올바른지 확인
- Google AI Studio에서 API 키가 활성화되어 있는지 확인
- 할당량(quota)이 남아있는지 확인

