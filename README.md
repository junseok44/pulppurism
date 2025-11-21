# 프로젝트 시작 가이드

이 문서는 프로젝트를 처음 시작하는 분들을 위한 상세한 가이드입니다. 단계별로 따라하시면 쉽게 프로젝트를 실행하고 작업할 수 있습니다.

## 📋 목차

1. [필수 준비사항](#필수-준비사항)
2. [프로젝트 설정](#프로젝트-설정)
3. [프로젝트 실행](#프로젝트-실행)
4. [코드 작업 가이드](#코드-작업-가이드)
5. [변경사항 저장 및 공유](#변경사항-저장-및-공유)

---

## 필수 준비사항

### 1. IDE (통합 개발 환경) 설치

코드를 작성하고 편집하기 위한 프로그램을 설치해야 합니다.

**추천: Cursor**
- [Cursor 공식 웹사이트](https://cursor.sh/)에서 다운로드
- **장점**: 오른쪽에 AI 대화창이 있어 코드 편집을 대화로 요청할 수 있습니다
- 예: "이 함수를 수정해줘", "에러를 고쳐줘" 등으로 말만 하면 자동으로 코드를 수정해줍니다

**대안: Visual Studio Code**
- VS Code를 사용 중이라면 그대로 사용하셔도 됩니다
- [VS Code 공식 웹사이트](https://code.visualstudio.com/)에서 다운로드

### 2. Node.js 설치 확인

**맥(Mac) 사용자:**
1. **터미널 열기**: 
   - Spotlight 검색(⌘ + Space)을 열고 "터미널" 또는 "Terminal" 입력 후 Enter
   - 또는 Finder > 응용 프로그램 > 유틸리티 > 터미널
2. 터미널이 열리면 다음 명령어를 입력하세요:

```bash
node --version
npm --version
```

버전이 출력되면 이미 설치되어 있는 것입니다. 

**설치가 필요한 경우:**
- 이 프로젝트는 **Node.js v20.11.0** 버전을 사용합니다
- [Node.js 공식 웹사이트](https://nodejs.org/)에서 v20.11.0 버전을 다운로드하여 설치하세요
- 설치 후 위 명령어로 버전을 확인하세요

---

## 프로젝트 설정

### 1. 레포지토리 클론

프로젝트 코드를 내 컴퓨터로 가져오는 과정입니다.

**맥(Mac) 사용자:**

1. **터미널 열기**
   - Spotlight 검색(⌘ + Space)을 열고 "터미널" 또는 "Terminal" 입력 후 Enter
   - 또는 Finder > 응용 프로그램 > 유틸리티 > 터미널

2. **프로젝트를 저장할 폴더로 이동**
   - 예: 바탕화면에 저장하려면:
   ```bash
   cd ~/Desktop
   ```
   - 예: 문서 폴더에 저장하려면:
   ```bash
   cd ~/Documents
   ```

3. **레포지토리 클론**
   ```bash
   git clone https://github.com/junseok44/pulppurism
   ```

4. **프로젝트 폴더로 이동**
   ```bash
   cd pulppurism
   ```
   
   > **팁**: `cd`는 "change directory"의 약자로, 폴더를 이동하는 명령어입니다.

### 2. 의존성 패키지 설치

프로젝트에 필요한 라이브러리들을 다운로드하는 과정입니다.

**맥(Mac) 사용자:**

1. **터미널이 열려있는지 확인**
   - 위에서 연 터미널을 그대로 사용하거나, 새로 열어주세요

2. **프로젝트 폴더(pulppurism)로 이동**
   ```bash
   cd ~/Desktop/pulppurism
   ```
   > **참고**: 프로젝트를 다른 위치에 저장했다면 그 경로로 바꿔주세요.

3. **패키지 설치**
   ```bash
   npm install
   ```

이 과정은 몇 분 정도 걸릴 수 있습니다. 완료되면 `node_modules` 폴더가 생성됩니다.

> **팁**: 터미널에서 명령어를 입력할 때는 복사(Copy) 후 터미널에 붙여넣기(Paste)를 하면 됩니다. 맥에서는 ⌘ + V로 붙여넣을 수 있습니다.

### 3. 환경 변수 파일 설정

데이터베이스 연결 정보 등 중요한 설정을 저장하는 파일입니다.

1. **프로젝트 루트 디렉토리(`pulppurism` 폴더)에 `.env` 파일 생성**
   - Finder에서 `pulppurism` 폴더를 열어주세요
   - 텍스트 편집기(메모장, TextEdit 등)를 열고 새 파일을 만듭니다
   - 파일명을 `.env`로 저장합니다 (앞에 점(.)이 중요합니다!)

2. **전달받은 `.env` 파일의 내용을 그대로 복사해서 붙여넣으세요**

> **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요! (이미 `.gitignore`에 포함되어 있을 것입니다)

---

## 프로젝트 실행

### 개발 서버 시작

**맥(Mac) 사용자:**

1. **터미널 열기** (아직 열려있지 않다면)
2. **프로젝트 폴더로 이동**
   ```bash
   cd ~/Desktop/pulppurism
   ```
3. **개발 서버 시작**
   ```bash
   npm run dev
   ```

성공적으로 실행되면 다음과 같은 메시지가 보일 것입니다:
```
✓ Server running on http://localhost:5001
```

### 브라우저에서 확인

1. 크롬(Chrome) 브라우저를 엽니다
2. 주소창에 `http://localhost:5001` 입력 후 Enter
3. 프로젝트가 화면에 표시됩니다!

### 핫 리로드 (Hot Reload)

코드를 수정하면 브라우저가 자동으로 새로고침되어 변경사항이 즉시 반영됩니다. 별도로 새로고침할 필요가 없습니다!

> **팁**: 개발 서버를 중지하려면 터미널에서 `Ctrl + C`를 누르면 됩니다.

---

## 코드 작업 가이드

### 작업 전 필수 단계: 브랜치 생성

여러 사람이 동시에 작업할 때 코드 충돌을 방지하기 위해, 각자 작업할 공간(브랜치)을 만들어야 합니다.

**맥(Mac) 사용자:**

1. **터미널 열기**

2. **프로젝트 폴더로 이동**
   ```bash
   cd ~/Desktop/pulppurism
   ```

3. **Main 브랜치로 이동**
   ```bash
   git checkout main
   ```

4. **최신 코드 가져오기**
   ```bash
   git pull origin main
   ```

5. **새로운 브랜치 생성 및 이동**
   ```bash
   git checkout -b feat/<브랜치명>
   ```

**브랜치명 예시:**
- `feat/user-login` - 사용자 로그인 기능 추가
- `feat/add-comments` - 댓글 기능 추가
- `fix/button-style` - 버튼 스타일 수정
- `feat/admin-dashboard` - 관리자 대시보드 추가

> **팁**: 브랜치명은 작업 내용을 간단히 설명하는 것이 좋습니다.

---

## 변경사항 저장 및 공유

### 1. 변경된 파일 확인

작업한 내용을 확인하려면:

**터미널에서:**
```bash
cd ~/Desktop/pulppurism
git status
```

변경된 파일 목록이 표시됩니다.

### 2. 변경사항 스테이징 (Staging)

변경된 파일들을 커밋할 준비를 하는 과정입니다.

```bash
git add .
```

> **설명**: `.`은 현재 폴더의 모든 변경사항을 의미합니다. 특정 파일만 추가하려면 `git add <파일명>`을 사용하세요.

### 3. 커밋 (Commit)

변경사항에 대한 설명을 작성하고 저장하는 과정입니다.

```bash
git commit -m "<메시지>"
```

**좋은 커밋 메시지 예시:**
- `git commit -m "feat: 사용자 로그인 기능 추가"`
- `git commit -m "fix: 버튼 클릭 시 에러 수정"`
- `git commit -m "style: 헤더 디자인 개선"`

> **팁**: 커밋 메시지는 무엇을 왜 변경했는지 명확하게 작성하는 것이 좋습니다.

### 4. 원격 저장소에 업로드

```bash
git push origin feat/<브랜치명>
```

예: `git push origin feat/user-login`

---

## 변경사항을 메인 브랜치에 병합하기

작업이 완료되면 변경사항을 메인 브랜치에 합쳐야 합니다.

**맥(Mac) 사용자:**

1. **터미널 열기**

2. **프로젝트 폴더로 이동**
   ```bash
   cd ~/Desktop/pulppurism
   ```

3. **메인 브랜치로 이동**
   ```bash
   git checkout main
   ```

4. **최신 코드 가져오기**
   ```bash
   git pull origin main
   ```
   
   > **중요**: 다른 사람이 작업한 내용이 있을 수 있으므로, 병합하기 전에 항상 최신 코드를 가져와야 합니다.

5. **작업한 브랜치 병합**
   ```bash
   git merge feat/<브랜치명>
   ```
   
   예: `git merge feat/user-login`
   
   > **참고**: 병합이 성공하면 "Fast-forward" 또는 "Merge made by ..." 같은 메시지가 표시됩니다.

6. **원격 저장소에 업로드**
   ```bash
   git push origin main
   ```

7. **작업 완료!** 🎉

> **팁**: 병합 후 작업한 브랜치는 삭제해도 됩니다:
> ```bash
> git branch -d feat/<브랜치명>
> ```

---

## 유용한 명령어 모음

### 프로젝트 실행 관련
```bash
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작
npm run check        # TypeScript 타입 체크
```

### Git 관련
```bash
git status                    # 변경사항 확인
git log                       # 커밋 히스토리 확인
git branch                    # 브랜치 목록 확인
git checkout <브랜치명>        # 브랜치 이동
git pull origin main          # 최신 코드 가져오기
```

### 터미널 기본 명령어
```bash
pwd                          # 현재 위치 확인
ls                           # 현재 폴더의 파일 목록 보기
cd <폴더명>                   # 폴더 이동
cd ..                        # 상위 폴더로 이동
cd ~                         # 홈 폴더로 이동
```

---

## 문제 해결

### 포트가 이미 사용 중일 때

다른 프로그램이 5001 포트를 사용 중일 수 있습니다. 다른 포트를 사용하거나 해당 프로그램을 종료하세요.

### npm install이 실패할 때

```bash
# 캐시 삭제 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Git 충돌이 발생했을 때

```bash
# 최신 코드 가져오기
git pull origin main

# 충돌 해결 후
git add .
git commit -m "resolve: 충돌 해결"
```

### 터미널에서 한글이 깨질 때

터미널 설정에서 폰트를 변경하거나, UTF-8 인코딩을 사용하도록 설정하세요.

---

## 추가 도움말

문제가 발생하거나 궁금한 점이 있으면 편하게 질문주세요.

