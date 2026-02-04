# 프로젝트 구조

```
2월 공모주 크롤링/
├── app/                          # Next.js App Router
│   ├── api/                      # API 라우트
│   │   ├── articles/             # 기사 조회 API
│   │   │   └── route.ts
│   │   └── crawl/                # 크롤링 및 요약 API
│   │       └── route.ts
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지
│
├── components/                   # React 컴포넌트
│   ├── ArticleCard.tsx           # 기사 카드 컴포넌트
│   ├── Dashboard.tsx             # 대시보드 메인 컴포넌트
│   └── SearchBar.tsx             # 검색 바 컴포넌트
│
├── lib/                          # 유틸리티 및 라이브러리
│   ├── crawler.ts                # Google News 크롤링 로직
│   ├── gemini.ts                 # Gemini API 통신
│   └── supabase.ts               # Supabase 클라이언트
│
├── types/                        # TypeScript 타입 정의
│   └── index.ts
│
├── supabase/                     # Supabase 스키마
│   └── schema.sql                # 데이터베이스 테이블 정의
│
├── .env.local.example            # 환경 변수 예시
├── .gitignore
├── INSTALL.md                    # 설치 가이드
├── next.config.js                # Next.js 설정
├── package.json                  # 프로젝트 의존성
├── postcss.config.js             # PostCSS 설정
├── README.md                     # 프로젝트 설명
├── tailwind.config.ts            # Tailwind CSS 설정
└── tsconfig.json                 # TypeScript 설정
```

## 주요 파일 설명

### API 라우트
- **`app/api/crawl/route.ts`**: 검색어를 받아 Google News에서 크롤링하고, Gemini API로 요약한 후 Supabase에 저장
- **`app/api/articles/route.ts`**: 저장된 기사 목록을 조회

### 컴포넌트
- **`Dashboard.tsx`**: 메인 대시보드, 검색 및 기사 목록 표시
- **`SearchBar.tsx`**: 검색어 입력 및 검색 실행
- **`ArticleCard.tsx`**: 개별 기사 카드 UI

### 라이브러리
- **`crawler.ts`**: Google News 크롤링 및 기사 내용 추출
- **`gemini.ts`**: Gemini API를 통한 뉴스 요약 및 구조화
- **`supabase.ts`**: Supabase 클라이언트 초기화

