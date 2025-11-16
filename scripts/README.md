# 옥천신문 게시물 임포트 스크립트

## 사용법

### 1. JSON 파일 준비

프로젝트 루트 디렉토리에 `articles.json` 파일을 생성하거나 다른 경로에 준비합니다.

JSON 파일 형식:
```json
[
  {
    "게시물 제목": "제목",
    "게시물 작성자": "작성자명",
    "게시물 작성 일시": "2025-11-08 19:55:53",
    "게시물 조회수": 225,
    "게시물 내용": "게시물 내용...",
    "댓글": [
      {
        "댓글 작성자": "댓글작성자",
        "댓글 작성 일시": "2025-11-08 21:47:47",
        "댓글 내용": "댓글 내용...",
        "댓글 좋아요": 2,
        "댓글 싫어요": 1
      }
    ]
  }
]
```

### 2. 스크립트 실행

**기본 경로 사용 (./articles.json):**
```bash
npx tsx scripts/import-articles.ts
```

**다른 경로 지정:**
```bash
npx tsx scripts/import-articles.ts /path/to/your/articles.json
```

### 3. 결과 확인

스크립트 실행 후 다음과 같은 결과를 확인할 수 있습니다:

```
Reading file: /home/runner/your-project/articles.json
Found 100 articles to import
Deleting existing data...
Existing data deleted. Starting import...

✅ Import completed successfully!
📝 Imported opinions: 100
💬 Imported comments: 250
```

## 주의사항

⚠️ **이 스크립트는 기존의 모든 클러스터와 주민의견 데이터를 삭제합니다.**

삭제되는 데이터:
- 모든 클러스터 (clusters)
- 의견-클러스터 연결 (opinion_clusters)
- 모든 주민 의견 (opinions)
- 모든 댓글 (comments)
- 모든 의견 좋아요 (opinion_likes)
- 모든 안건 북마크 (agenda_bookmarks)

임포트는 트랜잭션으로 처리되어 실패 시 자동으로 롤백됩니다.

## 기능

- ✅ 트랜잭션 기반 안전한 임포트
- ✅ 사전 데이터 유효성 검사
- ✅ 한글 날짜 형식 자동 파싱 ("YYYY-MM-DD HH:mm:ss")
- ✅ 사용자 자동 생성 (존재하지 않는 경우)
- ✅ 개별 아티클/댓글 에러 핸들링 (일부 실패해도 나머지는 계속 임포트)
- ✅ 상세한 임포트 통계 제공
