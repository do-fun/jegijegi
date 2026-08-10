# JEGI JEGI

OpenAI Game Builders Seoul 2026 출품을 위한 제기차기 기반 웹 아케이드 게임이다.
심사위원이 별도 설치나 승인 없이 URL에 접속해 바로 플레이할 수 있어야 한다.

## Product Goals

- 첫 입력 후 즉시 플레이를 시작할 수 있는 짧고 직관적인 아케이드 게임을 만든다.
- 핵심 재미는 좌우 이동으로 제기의 낙하 지점을 맞추고 플레이를 이어가는 데 둔다.
- 한 판의 규칙과 조작은 별도 설명 없이 짧은 시간 안에 이해할 수 있어야 한다.
- 작동성, 독창성, Codex 협업 과정, 출시 가능성, 발표력을 주요 품질 기준으로 삼는다.
- 게임은 정적 웹 빌드로 배포 가능해야 하며 로그인이나 백엔드에 의존하지 않는다.

## Technology

- TypeScript
- Phaser
- Vite
- HTML/CSS
- Cloudflare static hosting
- `localStorage` for local settings and best scores when persistence is needed

React, 별도 백엔드, 데이터베이스, 추가 물리 엔진은 명확한 필요가 생기기 전에는 도입하지 않는다.
렌더링, 입력, 사운드, 애니메이션과 기본 물리는 우선 Phaser 기능으로 해결한다.

## Setup and Commands

프로젝트 스캐폴딩 이후 아래 명령을 표준으로 유지한다.

- Install: `npm install`
- Dev: `npm run dev`
- Type-check: `npm run typecheck`
- Test: `npm test`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Deploy to Cloudflare: `npm run deploy` after the Cloudflare configuration is added

명령이 추가되거나 변경되면 `package.json`과 이 문서를 함께 갱신한다.

## Screen Flow

사용자에게 보이는 핵심 화면은 두 개만 둔다.

1. Title screen
   - 게임 로고 또는 게임명을 표시한다.
   - PC에서는 `아무 키나 누르세요`, 터치 기기에서는 `화면을 터치하세요`에 해당하는 안내를 표시한다.
   - 첫 키보드 입력이나 터치 입력으로 게임을 시작한다.
   - 첫 입력은 브라우저 오디오 재생 권한 활성화에도 사용한다.
2. Game screen
   - 실제 제기차기 플레이와 최소한의 HUD를 표시한다.
   - 게임 종료 결과는 별도 페이지 대신 게임 화면 위 오버레이로 표시한다.
   - 결과 오버레이에서 키보드 입력이나 터치로 즉시 재시작할 수 있어야 한다.

에셋 로딩을 위한 Boot scene은 내부 구현으로 둘 수 있지만 사용자에게 별도 메뉴처럼 보이지 않아야 한다.
설정, 스테이지 선택, 계정, 상점 같은 화면은 현재 범위에 포함하지 않는다.

## Controls

PC 브라우저의 키보드 조작을 우선한다.

- Move left: `ArrowLeft` or `A`
- Move right: `ArrowRight` or `D`
- Start or restart: any keyboard key

모바일은 별도 게임 모드가 아니라 동일한 플레이를 위한 보조 입력을 제공한다.

- 화면 왼쪽 영역을 누르면 왼쪽으로 이동한다.
- 화면 오른쪽 영역을 누르면 오른쪽으로 이동한다.
- 터치 영역 또는 버튼은 모바일에서만 반투명하게 표시할 수 있다.
- 키보드와 터치 입력은 게임 로직에서 직접 처리하지 않고 공통 action 상태로 변환한다.

입력 장치에 따라 핵심 규칙이나 점수 체계가 달라지지 않도록 한다.

## Project Structure

구현을 시작할 때 다음 구조를 기본으로 사용하되 실제 필요에 따라 단순화할 수 있다.

```text
src/
  main.ts
  game/
    config.ts
    scenes/
      BootScene.ts
      TitleScene.ts
      GameScene.ts
    objects/
      Player.ts
      Jegi.ts
    systems/
      InputManager.ts
      ScoreManager.ts
      AudioManager.ts
  styles/
    main.css
public/
  assets/
```

- Scene은 화면 흐름과 수명 주기를 조정한다.
- 게임 규칙과 계산을 Phaser 표시 객체 안에 과도하게 섞지 않는다.
- 키보드와 터치의 차이는 `InputManager` 경계 안에서 처리한다.
- 재사용되지 않는 작은 로직을 성급하게 별도 시스템이나 클래스로 추출하지 않는다.

## Hosting and Deployment

- 배포 플랫폼은 Cloudflare를 사용한다.
- 게임은 Vite의 `dist/` 정적 빌드 결과물만으로 실행 가능해야 한다.
- Cloudflare 설정은 저장소에서 재현 가능하도록 Wrangler 설정과 `package.json` 스크립트로 관리한다.
- 기존에 운영 중인 agentinit 사이트와 같은 Cloudflare 계정 및 운영 방식을 우선 참고하되, 프로젝트 이름과 배포 대상은 분리한다.
- 로컬 개발 환경이나 비공개 파일에만 존재하는 설정에 의존하지 않는다.
- 해시가 포함된 정적 에셋은 장기 캐시할 수 있지만 `index.html`은 새 배포가 즉시 반영되도록 과도하게 캐시하지 않는다.
- 배포 URL에서 루트 접속, 새로고침, 에셋 로딩, 키보드 입력과 터치 입력을 다시 검증한다.

## Code Style and Architecture

- TypeScript strict mode를 유지하고 불가피한 경우가 아니면 `any`를 사용하지 않는다.
- 기존 파일의 패턴을 우선하며 추상화는 실제 중복이나 교체 필요가 있을 때 추가한다.
- 게임 플레이에 영향을 주는 숫자는 의미 있는 이름의 상수나 설정으로 관리한다.
- Scene 간에 암묵적인 전역 상태를 공유하지 않는다.
- 게임 상태는 재시작할 때 완전히 초기화되어야 한다.
- 데스크톱과 모바일 레이아웃에서 플레이 영역이 잘리거나 입력 영역이 어긋나지 않게 한다.
- 브라우저 크기 변경과 고해상도 디스플레이를 고려하되, 시각적 완성도보다 플레이 안정성을 우선한다.
- 사용자에게 표시되는 문구는 한 언어 안에서 일관성을 유지한다.

## Testing and Validation

모든 변경은 최소한 다음을 확인한다.

- TypeScript type-check가 통과한다.
- 프로덕션 빌드가 성공한다.
- 타이틀 화면에서 키보드와 터치로 게임을 시작할 수 있다.
- 좌우 동시 입력, 입력 해제, 브라우저 포커스 이탈 후에도 이동 상태가 고정되지 않는다.
- 게임 종료 후 재시작하면 점수, 콤보, 제기와 플레이어 상태가 초기화된다.
- 새로고침 후에도 별도 로그인 없이 플레이할 수 있다.
- 일반적인 데스크톱 화면과 모바일 세로/가로 화면에서 게임 영역을 확인한다.
- 브라우저 콘솔에 처리되지 않은 오류가 없어야 한다.

게임 물리나 점수 계산처럼 Phaser 렌더링 없이 검증 가능한 규칙은 순수 함수로 분리하고 단위 테스트를 추가한다.
시각적 또는 입력 변경은 자동 테스트만으로 완료하지 말고 실제 브라우저 플레이로 확인한다.

## Workflow

- 먼저 가장 작은 플레이 가능한 루프를 완성한 뒤 연출, 사운드, 추가 규칙을 더한다.
- 게임의 핵심 조작이나 화면 흐름을 바꿀 때는 구현 전에 이 문서와 일치하는지 확인한다.
- Codex가 구현한 기능, 해결한 문제, 사용자가 직접 결정한 부분을 제출 자료로 정리할 수 있게 개발 기록을 남긴다.
- 기존 프로젝트를 활용하게 되는 경우 대회 기간에 새로 개발한 범위를 명확히 기록한다.
- Cloudflare 배포는 프로덕션 빌드를 로컬에서 검증한 뒤 진행한다.

## Security and Boundaries

- 비밀 값, 인증 정보, 개인 정보와 `.env` 파일을 커밋하지 않는다.
- 게임 실행을 위해 외부 계정, 로그인, 추적 스크립트를 요구하지 않는다.
- 외부 에셋과 폰트는 사용 권리와 라이선스를 확인하고 출처가 필요한 경우 기록한다.
- Cloudflare 외의 배포 대상과 새로운 외부 서비스, 유료 API, 분석 도구 또는 백엔드 추가는 사용자와 먼저 합의한다.
- 실제 배포와 외부 서비스 변경은 사용자가 명시적으로 요청한 경우에만 수행한다.
