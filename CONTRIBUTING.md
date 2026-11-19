# kowrap 개발 및 기여 안내

제품 소개는 [README](README.md), 라이브러리 사용법은 [사용 문서](docs/guide/start.md)를 참고하세요. 공통 기여 절차는 [Oddmash 기여 안내](https://github.com/Oddmash/.github/blob/main/CONTRIBUTING.md)에 있으며 모듈 책임과 의존성 방향은 [아키텍처](docs/ARCHITECTURE.md)에 정리되어 있습니다.

## 개발 환경

코어는 Node.js 20 이상을 지원하며 CI와 문서 사이트는 Node.js 24를 사용합니다.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

## 검증

| 명령 | 역할 |
| --- | --- |
| `pnpm test` | 코어, 아키텍처, SSR 및 릴리스 검사 |
| `pnpm test:hydration` | React 하이드레이션과 DOM 어댑터 검사 |
| `pnpm test:frameworks` | 실제 Vue와 Svelte 런타임 검사 |
| `pnpm test:next` | Next.js 프로덕션 빌드 |
| `pnpm test:browser` | Chromium 프레임워크 통합 검사 |
| `pnpm test:package` | npm 패키지 공개 진입점 및 구성 검사 |
| `pnpm test:site` | Next.js 문서 사이트 정적 export 및 내용 검사 |

프레임워크 테스트 전에 다음 의존성을 준비합니다.

```bash
pnpm --dir test/next-app install --no-frozen-lockfile
pnpm --dir test/framework-app install --no-frozen-lockfile
pnpm --dir test/next-app exec playwright install chromium
```

## 문서 사이트

사용 설명은 `docs/guide/*.md`에서 관리합니다. 문서 페이지는 `site/`의 Next.js App Router에서 빌드 시 읽으므로 HTML 문서를 중복 편집하지 않습니다. 문서 탐색 순서는 `site/lib/guides.ts`에 있습니다.

```bash
pnpm build
pnpm --dir site install --no-frozen-lockfile
pnpm --dir site dev
```

로컬 개발 서버에서 랜딩의 실제 적용 전후 비교, 입력 변경, 강제 개행 및 문서 검색을 확인합니다. 비교는 실제 일반 p 요소와 kowrap의 WrapText를 사용하며 코드가 설정과 동기화되어야 합니다.

Oddmash의 [시각 지침](https://github.com/Oddmash/oddmash-ui/blob/main/AGENTS.md)에 맞춘 중립 팔레트 및 토큰은 `site/theme/tokens.json`에 둡니다. 파란색은 포커스, 빨간색은 오류에 사용합니다. UI에서 긴 대시를 장식 문자로 사용하지 않습니다.

### 정적 배포

```bash
NEXT_PUBLIC_BASE_PATH=/kowrap pnpm test:site
pnpm --dir site exec playwright install chromium
NEXT_PUBLIC_BASE_PATH=/kowrap pnpm --dir site test:browser
```

Next.js의 정적 export 결과는 `site/out/`에 생성됩니다. npm 패키지의 `dist/`와 별개입니다.

GitHub 저장소의 Settings > Pages > Build and deployment에서 Source를 GitHub Actions로 선택합니다. `pages.yml`은 main의 관련 변경사항 또는 수동 실행에서 정적 사이트를 빌드하고 검증한 뒤 GitHub Pages에 배포합니다. 배포 URL은 https://oddmash.github.io/kowrap/ 입니다.

## npm 릴리스

최초 패키지 등록 이후에는 `package.json` 버전과 동일한 `vX.Y.Z` 태그로 GitHub Release를 발행합니다. 안정 버전 릴리스 발행 시 `Publish npm package` 워크플로가 자동 실행됩니다. main에서 수동으로 버전을 입력해 publish를 끈 상태로 검증할 수도 있습니다. 기존 npm 버전은 다시 발행하지 않으며 테스트를 통과한 tarball만 배포합니다.

릴리스 노트는 [변경 이력](CHANGELOG.md)과 `docs/releases/vX.Y.Z.md`에 기록합니다. 최초 이력 정리는 0.2.0 변경사항을 커밋한 후 `node scripts/prepare-release-history.mjs`를 실행합니다. 기존 태그를 덮어쓰지 않으며 v0.1.1과 v0.2.0은 순차로 발행합니다.

npm Trusted Publisher 설정은 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | Oddmash |
| Repository | kowrap |
| Workflow filename | publish.yml |
| Environment | 비워 둠 |
| Allowed actions | npm publish 허용 |

최초 버전이 없다면 소유자가 npm 로그인 및 2FA로 공개 패키지를 등록하고 OIDC를 연결합니다.

```bash
npm login
npm publish --access public
```

워크플로에는 장기 npm 토큰을 사용하지 않습니다. 라이선스 및 공개 범위를 확정한 뒤 실제 발행을 진행하세요.

## 라이선스

독립적으로 작성된 구현입니다. 라이선스 및 최초 공개 배포 정책은 프로젝트 소유자의 결정에 따릅니다.
