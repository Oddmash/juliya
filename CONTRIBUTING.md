# kowrap 개발 및 기여 안내

제품 개요는 [README](README.md), 공통 기여 절차는 [Oddmash 기여 안내](https://github.com/Oddmash/.github/blob/main/CONTRIBUTING.md)를 참고하세요.

모듈 책임과 의존성 방향은 [아키텍처](docs/ARCHITECTURE.md)를 참고하세요.

## 기능

- 기본적으로 한국어 어절과 Unicode grapheme을 보존합니다.
- 줄 수를 우선 최소화한 뒤, 줄 길이의 편차와 문장·구 경계에 따른 비용으로 줄바꿈을 선택합니다.
- 긴 어절이 한 줄에 들어가지 않을 때만 grapheme 경계에서 나눕니다.
- 원문 복원에 필요한 UTF-16 범위와 명시적 줄바꿈을 반환합니다.
- React SSR, Next.js App Router의 Server/Client Component 경계를 지원합니다.

## 설치

Node.js 20 이상이 필요합니다. 로컬 개발 환경을 준비합니다.

```bash
pnpm install
pnpm build
```

## JavaScript / TypeScript

```ts
import { wrap } from '@oddmash/kowrap';

const lines = wrap('오늘은 모든 사람이 함께 자연스럽게 줄바꿈합니다.', {
  width: 14,
  measure: (text) => [...text].length,
});
```

위 예시는 문자 수를 폭으로 사용하는 간단한 예시입니다. 실제 화면에서는 픽셀 단위 측정 함수를 전달합니다.

```ts
import { wrap } from '@oddmash/kowrap';
import { createCanvasMeasure } from '@oddmash/kowrap/browser';

const measure = createCanvasMeasure({ font: '400 18px sans-serif' });
const lines = wrap('한국어와 English를 함께 사용합니다.', { width: 240, measure });
```

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `width` | 필수 | 한 줄 최대 폭 |
| `measure` | 필수 | 문자열의 폭을 반환하는 함수 |
| `strategy` | `balanced` | 균형 최적화 또는 `greedy` |
| `breakLongWords` | `true` | 지나치게 긴 어절을 grapheme 단위로 줄바꿈 |
| `forcedBreaks` | `[]` | 모든 폭에서 반드시 끊을 원문 UTF-16 위치 |

`WrappedLine`은 `text`, `start`, `end`, `width`, `breakAfter`를 제공합니다. `width`는 줄 끝의 일반 공백을 제외하고 측정합니다. 각 `text + breakAfter`를 이어 붙이면 입력 문자열을 복원할 수 있습니다.

`segmentSentences(text, locale?)`는 원문 범위를 유지하며 문장을 분리합니다.

### 의도적인 개행

원문에 `\n`을 넣거나 `forcedBreaks`로 특정 위치를 강제할 수 있습니다. 강제 위치는 원문의 UTF-16 인덱스이며 grapheme 내부, 0, 문자열 끝은 허용하지 않습니다. 원문 자체에는 새 개행 문자를 삽입하지 않습니다.

```ts
import { splitLines, wrap } from '@oddmash/kowrap';

const text = '자연스러운 한국어 줄바꿈을 경험하세요';
const forcedBreaks = [text.indexOf('줄바꿈')];
const lines = wrap(text, { width: 320, measure: (value) => value.length * 10, forcedBreaks });
const initialLines = splitLines(text, forcedBreaks);
```

`splitLines`는 브라우저 폭 없이 명시적 개행과 강제 경계만 미리 결정합니다. SSR이나 프레임워크 자체 렌더링에 사용할 수 있고, 아직 측정하지 않았으므로 각 `width`는 0입니다.

## React / Next.js

```tsx
import { WrapText } from '@oddmash/kowrap/react';
import { SentenceText } from '@oddmash/kowrap/react/server';

const Page = () => (
  <main>
    <WrapText as="h1" style={{ maxWidth: 480 }} forcedBreaks={[6]}>
      모든 사람이 자연스러운 한국어 줄바꿈을 경험할 수 있도록
    </WrapText>
    <SentenceText as="p">
      한국어 문장입니다. 문장 사이에서 먼저 줄을 바꿉니다.
    </SentenceText>
  </main>
);

export default Page;
```

별도 Next.js 설정이나 전역 CSS는 필요하지 않습니다.

- `WrapText`는 Next.js의 Client Component입니다. 최초 SSR과 하이드레이션에서 동일한 원문을 그린 후 실제 브라우저 폭, 글꼴과 리사이즈를 반영합니다.
- `SentenceText`는 브라우저 API와 React Hook을 사용하지 않아 Server Component에서 그대로 사용할 수 있습니다. JavaScript 없이도 CSS로 문장 단위 줄바꿈을 제공합니다.
- `wrap`과 `segmentSentences`는 React 없이 Node.js와 Server Component에서 실행할 수 있습니다. React는 선택적 peer dependency입니다.

### React 훅

`useKowrap`으로 직접 렌더링하거나 강제 경계를 동적으로 변경할 수 있습니다. `initialForcedBreaks`는 초기 설정, `forcedBreaks`와 `onForcedBreaksChange`는 제어형 설정입니다.

```tsx
'use client';

import { Fragment } from 'react';
import { useKowrap } from '@oddmash/kowrap/react';

const Example = () => {
  const text = '한국어 줄바꿈을 경험하세요';
  const { ref, lines, setForcedBreaks, clearForcedBreaks } = useKowrap({ text });
  return (
    <>
      <p ref={ref} style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
        {lines.map((line, index) => (
          <Fragment key={line.start}>
            {line.text}{line.breakAfter || (index < lines.length - 1 ? <br /> : null)}
          </Fragment>
        ))}
      </p>
      <button onClick={() => setForcedBreaks([text.indexOf('줄바꿈')])}>개행 지정</button>
      <button onClick={clearForcedBreaks}>자동 개행</button>
    </>
  );
};
```

`measured`가 `false`인 초기 렌더링에서는 `splitLines`와 같은 결과를 반환합니다.

## 일반 HTML 및 JavaScript

```html
<p id="title">자연스러운 한국어 줄바꿈</p>
<script type="module">
  import { mountKowrap } from '/vendor/kowrap/dist/dom/index.js';

  const element = document.getElementById('title');
  const text = element.textContent;
  const controller = mountKowrap(element, { text, forcedBreaks: [text.indexOf('줄바꿈')] });
</script>
```

일반 HTML에서는 패키지의 `dist/` 디렉터리를 정적 파일로 제공하거나 ESM CDN을 사용합니다. 번들러를 쓰는 경우 `@oddmash/kowrap/dom`으로 import합니다(`@oddmash/kowrap/browser`도 동일하게 동작합니다). `controller.update(options)`, `refresh()`, `destroy()`를 호출할 수 있습니다. `mountKowrap`은 대상 요소의 자식 DOM을 소유하므로 일반 텍스트 전용 요소에서 사용합니다. `observeKowrap(element, options, callback)`은 DOM을 수정하지 않고 `lines`, `measured`만 제공하므로 Angular, Solid 등 자체 렌더러에도 연결할 수 있습니다.

실행 가능한 기본 HTML 예시는 [examples/html/index.html](examples/html/index.html)에 있습니다. 빌드 후 저장소 루트를 정적 파일 서버에서 제공해 열 수 있습니다.

## Vue 3

```vue
<script setup>
import { ref } from 'vue';
import { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';

const text = ref('자연스러운 한국어 줄바꿈');
const breaks = ref([text.value.indexOf('줄바꿈')]);
</script>

<template>
  <p v-kowrap="{ text, forcedBreaks: breaks }"></p>
</template>
```

## Svelte 5

```svelte
<script>
  import { kowrap } from '@oddmash/kowrap/svelte';
  let text = $state('자연스러운 한국어 줄바꿈');
  let breaks = $state([text.indexOf('줄바꿈')]);
</script>

<p use:kowrap={{ text, forcedBreaks: breaks }}></p>
```

Vue 디렉티브와 Svelte 액션은 클라이언트에서 작동하며 별도 Vue·Svelte 런타임 의존성을 추가하지 않습니다. Nuxt 또는 SvelteKit에서 서버 렌더링이 필요하다면 `splitLines`로 초기 원문을 렌더링하고 클라이언트에서 `observeKowrap` 결과를 프레임워크의 상태에 연결합니다. 전용 디렉티브·액션을 사용하는 요소의 자식은 kowrap이 관리하므로 프레임워크가 별도로 동적 자식을 렌더링하지 않습니다.

## 현재 범위

`WrapText`는 일반 텍스트를 대상으로 하며 인라인 JSX 마크업은 아직 지원하지 않습니다. 정확한 글자 폭은 서버에서 알 수 없으므로 SSR 최초 화면에서는 CSS 줄바꿈을 사용합니다. 첫 하이드레이션 후 줄 위치가 달라질 수 있습니다. 별도 사전 하이드레이션 스크립트는 주입하지 않습니다.

Canvas 폭 측정은 브라우저 지원에 따라 글자 간격, 탭, 복잡한 폰트 기능에서 실제 DOM 레이아웃과 약간 다를 수 있습니다. 커스텀 측정 함수는 문자열이 늘어날수록 폭이 대체로 증가한다고 가정합니다. 한국어 수식 관계 판정은 형태소 분석이 아닌 휴리스틱이며, 긴 본문보다 제목·짧은 문단 최적화에 적합합니다.

Node.js 20 이상과 `Intl.Segmenter`를 지원하는 현대 브라우저를 대상으로 합니다.

## 디자인 시스템 연동

향후 디자인 시스템에서 사용할 때는 이 패키지를 런타임 의존성으로 선언하고 번들에 포함하지 않는 방식이 적합합니다. 호환 가능한 버전 범위 안의 로직 변경은 kowrap만 배포하고 소비 프로젝트의 lockfile을 갱신하면 적용할 수 있습니다. 기존 디자인 시스템은 이 저장소에서 변경하지 않습니다.

## 검증

```bash
pnpm test
pnpm build
pnpm --dir test/next-app install --no-frozen-lockfile
pnpm test:hydration
pnpm --dir test/framework-app install --no-frozen-lockfile
pnpm test:frameworks
pnpm test:next
pnpm --dir test/next-app exec playwright install chromium
pnpm test:browser
pnpm test:package
```

코어 테스트, SSR 렌더링, React 하이드레이션, Next.js 정적·동적 렌더링 빌드와 Chromium 반응형 통합 테스트를 제공합니다.

## npm 릴리스

최초 패키지 등록 이후에는 `package.json` 버전과 동일한 `vX.Y.Z` 태그로 GitHub Release를 발행합니다. 안정 버전 릴리스 발행 시 `Publish npm package` 워크플로가 자동으로 실행됩니다. `main`에서 수동으로 버전을 입력해 `publish`를 끈 상태로 검증할 수 있습니다. npm에 이미 발행된 버전은 다시 발행하지 않으며 모든 테스트를 통과한 tarball만 배포합니다.

릴리스 노트는 [변경 이력](CHANGELOG.md)과 `docs/releases/vX.Y.Z.md`에 기록합니다. 최초 이력 정리는 0.2.0 변경사항을 커밋한 후 `node scripts/prepare-release-history.mjs`로 진행합니다. 이 스크립트는 초기 커밋에 v0.1.0, 초기 커밋에서 배포 설정만 개선한 별도 패치 커밋에 v0.1.1, 현재 0.2.0 커밋에 v0.2.0 태그를 생성합니다. 기존 태그를 덮어쓰지 않습니다. v0.1.1 이후 v0.2.0 릴리스는 순차로 발행하고 각 npm 배포가 성공했는지 확인합니다.

npm의 Trusted Publisher는 다음 값으로 구성합니다.

| 항목 | 값 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `Oddmash` |
| Repository | `kowrap` |
| Workflow filename | `publish.yml` |
| Environment | 비워 둠 |
| Allowed actions | `npm publish` 허용 |

새 패키지는 Trusted Publisher를 연결하기 전에 npm에서 패키지를 생성해야 할 수 있습니다. 최초 버전이 아직 없다면 소유자가 npm 로그인 및 2FA로 초기 발행한 후 OIDC를 연결합니다. 같은 버전은 다시 발행할 수 없으므로 다음 릴리스의 버전을 올립니다.

```bash
npm login
npm publish --access public
```

워크플로에는 장기 npm 토큰을 사용하지 않습니다. OIDC 연결 후 `publish`를 켜서 실행하면 검증한 tarball을 발행합니다. 라이선스 및 공개 범위를 확정한 뒤 실제 발행을 진행하세요.

## 라이선스

독립적으로 작성된 구현입니다. 라이선스 및 최초 공개 배포 정책은 정해지는 대로 추가합니다.
