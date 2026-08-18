# JEGI JEGI Development Instructions

이 문서는 Codex가 저장소에서 개발 작업을 수행할 때 따라야 할 기술적 지침과 작업 제약만 정의한다.
게임 규칙, 화면 구성, 조작, 점수, 스테이지와 연출에 관한 제품 설계는 `docs/design_doc.md`를 기준으로 삼고 이 문서에 중복해서 기록하지 않는다.

## Source of Truth

- 게임 및 제품 설계의 기준 문서는 `docs/design_doc.md`이다.
- 사용자가 게임 설계 변경을 요청하면 별도 요청이 없는 한 `docs/design_doc.md`만 수정한다.
- 구현 중 설계 문서에 없는 제품 결정을 임의로 확정하지 않는다.
- 개발 명령이나 프로젝트 구조가 변경되면 `package.json`, 이 문서와 관련 개발 문서를 함께 갱신한다.

## Technology

- TypeScript
- Phaser
- Vite
- HTML/CSS
- Cloudflare static hosting
- 필요한 경우 로컬 설정과 기록 저장에 `localStorage` 사용

React, 별도 백엔드, 데이터베이스와 추가 물리 엔진은 명확한 기술적 필요가 생기고 사용자와 합의하기 전에는 도입하지 않는다.
렌더링, 입력, 사운드와 애니메이션은 우선 Phaser 기능으로 구현한다.
프로덕션 결과물은 로그인이나 백엔드 없이 정적 파일만으로 실행 가능해야 한다.

## Setup and Commands

- Install: `npm install`
- Dev: `npm run dev`
- Type-check: `npm run typecheck`
- Test: `npm test`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Deploy to Cloudflare: Cloudflare 설정이 추가된 뒤 `npm run deploy`

명령이 추가되거나 변경되면 `package.json`과 이 문서를 함께 갱신한다.

## Architecture

- Scene은 화면 흐름과 수명 주기를 조정한다.
- 키보드와 포인터 입력은 공통 action 상태로 변환하고 게임 로직에서 장치별 입력을 직접 처리하지 않는다.
- 계산과 상태 전이는 가능한 한 Phaser 표시 객체와 분리한다.
- 렌더링 없이 검증 가능한 로직은 순수 함수로 작성한다.
- 재사용되지 않는 작은 로직을 성급하게 별도 시스템이나 클래스로 추출하지 않는다.
- Scene 사이에 암묵적인 전역 상태를 공유하지 않는다.
- 재시작과 Scene 재진입 시 관련 상태와 이벤트 리스너가 완전히 초기화되어야 한다.

기본 구조는 다음을 참고하되 실제 필요에 따라 단순화할 수 있다.

```text
src/
  main.ts
  game/
    config.ts
    scenes/
    objects/
    systems/
  styles/
    main.css
public/
  assets/
```

## Code Style

- TypeScript strict mode를 유지한다.
- 불가피한 경우가 아니면 `any`를 사용하지 않는다.
- 기존 파일의 패턴을 우선한다.
- 동작에 영향을 주는 숫자는 의미 있는 이름의 상수나 설정으로 관리한다.
- 브라우저 크기 변경과 고해상도 디스플레이를 고려한다.
- 사용자 변경과 관련 없는 파일을 수정하거나 되돌리지 않는다.

## Testing and Validation

모든 코드 변경은 변경 범위에 맞게 다음을 확인한다.

- `npm run typecheck`가 통과한다.
- `npm test`가 통과한다.
- `npm run build`가 성공한다.
- 상태 계산처럼 렌더링 없이 검증 가능한 로직에는 단위 테스트를 추가한다.
- 시각적 또는 입력 관련 변경은 자동 테스트만으로 완료하지 않고 실제 브라우저에서도 확인한다.
- 브라우저 크기 변경, 포커스 이탈과 Scene 재진입 후 입력 상태가 남지 않는지 확인한다.
- 브라우저 콘솔에 처리되지 않은 오류가 없는지 확인한다.

## Workflow

- 구현 전에 관련 기존 코드와 `docs/design_doc.md`를 확인한다.
- 가장 작은 테스트 가능한 단위로 구현하고 검증한다.
- 플레이 감각에 영향을 주는 수치는 상수로 두고 플레이 테스트 결과에 따라 조정할 수 있게 한다.
- Codex가 구현한 기능, 해결한 문제와 사용자가 결정한 사항을 제출 자료로 정리할 수 있도록 개발 기록을 남긴다.
- 기존 프로젝트를 활용하는 경우 대회 기간에 새로 개발한 범위를 구분해 기록한다.
- Cloudflare 배포는 프로덕션 빌드를 로컬에서 검증한 뒤 진행한다.
- 실제 배포와 외부 서비스 변경은 사용자가 명시적으로 요청한 경우에만 수행한다.

## Hosting

- 배포 플랫폼은 Cloudflare를 사용한다.
- Vite의 `dist/` 정적 빌드 결과물만으로 실행 가능해야 한다.
- Cloudflare 설정은 저장소에서 재현 가능하도록 Wrangler 설정과 `package.json` 스크립트로 관리한다.
- 프로젝트 설정이 로컬 개발 환경이나 비공개 파일에만 의존하지 않게 한다.
- 해시가 포함된 정적 에셋은 장기 캐시할 수 있지만 `index.html`은 새 배포가 즉시 반영되도록 과도하게 캐시하지 않는다.
- 배포 전후 루트 접속, 새로고침과 정적 에셋 로딩을 확인한다.

## License

- 이 저장소는 브랜치 생성 시 추가된 Apache License 2.0을 적용하며, 저장소 루트의 `LICENSE`를 기준으로 한다.
- 기존 라이선스와 저작권 고지를 삭제하거나 임의로 변경하지 않는다.
- 외부 코드, 에셋, 폰트와 기타 의존성을 추가할 때 Apache License 2.0 프로젝트에서 사용할 수 있는지 확인한다.
- 별도 고지나 출처 표기가 필요한 외부 자료는 해당 요구 사항을 저장소에 함께 기록한다.

## Security and Boundaries

- 비밀 값, 인증 정보, 개인정보와 `.env` 파일을 커밋하지 않는다.
- 외부 계정, 로그인과 추적 스크립트를 실행 조건으로 추가하지 않는다.
- 외부 에셋과 폰트의 사용 권리와 라이선스를 확인하고 필요한 출처를 기록한다.
- Cloudflare 외의 배포 대상, 새로운 외부 서비스, 유료 API, 분석 도구 또는 백엔드는 사용자와 먼저 합의한다.
- 사용자 요청 없이 실제 배포, 외부 서비스 변경이나 파괴적인 작업을 수행하지 않는다.

## Document Boundary

- 이 문서에는 개발 환경, 코드 구조, 검증 방법, 작업 절차와 Codex의 제약만 기록한다.
- 게임 규칙과 제품 설계는 `docs/design_doc.md`에만 기록한다.
- 이후 게임 설계가 변경되어도 해당 내용을 이 문서에 복사하거나 요약해 추가하지 않는다.


### Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct. No over-engineering.
- If unsure: say so. Never guess or invent file paths.
- User instructions always override this file.

### Efficiency
- Read before writing. Understand the problem before coding.
- No redundant file reads. Read each file once.
- One focused coding pass. Avoid write-delete-rewrite cycles.
- Test once, fix if needed, verify once. No unnecessary iterations.
- Budget: 50 tool calls maximum. Work efficiently.

- Always respond in Korean.
- Maintain and respect existing project architecture and context.
