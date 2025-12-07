# Clustering Script

이 스크립트는 의견(opinions)을 자동으로 클러스터링하는 독립 실행 가능한 스크립트입니다. Cloud Functions나 별도의 서버 인스턴스에서 실행할 수 있습니다.

## 기능

- 미클러스터링된 의견들을 자동으로 찾아서 클러스터링
- OpenAI Embeddings API를 사용하여 의견 간 유사도 계산
- 유사도가 높은 의견들을 그룹화하여 클러스터 생성
- 각 클러스터에 대한 제목과 요약 자동 생성

## 필수 환경 변수

- `DATABASE_URL`: PostgreSQL 데이터베이스 연결 문자열
- `OPENAI_API_KEY`: OpenAI API 키 (embeddings 및 제목 생성에 사용)

## 사용 방법

### 로컬에서 실행

```bash
npm run cluster
```

또는 직접 실행:

```bash
npx tsx scripts/run-clustering.ts
```

### Cloud Function에서 실행

1. 스크립트 파일과 필요한 의존성을 Cloud Function에 배포
2. 환경 변수 설정:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
3. Cloud Function의 엔트리 포인트를 `scripts/run-clustering.ts`로 설정

### 빌드 후 실행

```bash
# 빌드
npm run build

# 실행
node dist/scripts/run-clustering.js
```

## 출력

스크립트는 다음 정보를 출력합니다:

- 생성된 클러스터 수 (`clustersCreated`)
- 처리된 의견 수 (`opinionsProcessed`)
- 실행 시간 (`durationMs`, `durationSeconds`)

## 에러 처리

- 필수 환경 변수가 없으면 즉시 종료 (exit code 1)
- 클러스터링 중 에러 발생 시 상세한 에러 메시지와 함께 종료 (exit code 1)
- 성공 시 exit code 0으로 종료

## 로깅

모든 로그는 `[run-clustering]` 또는 `[clusterOpinions]` 접두사를 사용하여 출력됩니다.

