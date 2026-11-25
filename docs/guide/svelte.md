# Svelte

Svelte에서는 `kowrap` 액션을 사용합니다. 라이브러리가 Svelte 런타임을 직접 의존하지 않으므로 기존 Svelte 프로젝트에 추가할 수 있습니다.

## 기본 액션

```svelte
<script lang="ts">
  import { kowrap } from '@oddmash/juliya/svelte';

  let text = $state('자연스러운 한국어 줄바꿈을 경험하세요.');
</script>

<p use:kowrap={{ text }}></p>
```

문자열 모드에서는 자식 콘텐츠를 Svelte에서 동시에 변경하지 마세요.

## 언어 선택

신규 다국어 지원 버전에서는 액션에 `locale`을 전달합니다. 생략하면 한국어 규칙을 사용합니다.

```svelte
<p use:kowrap={{ text: '让每一行自然易读。', locale: 'zh-Hans' }}></p>
```

## 필수 옵션

| 모드 | 필수 입력 | 선택 입력 |
| --- | --- | --- |
| 문자열 | `text` | `locale`, `strategy`, `breakLongWords`, `forcedBreaks` |
| 인라인 | `inline: true` | `locale`, `strategy`, `breakLongWords`, `forcedBreaks` |

인라인 모드에서는 `text`를 전달하지 않습니다. 자세한 타입과 기본값은 [DOM 옵션](dom.md#옵션)을 확인하세요.

## 인라인 마크업

```svelte
<p use:kowrap={{ inline: true }}>
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과
  <a href="/docs/">문서</a>를 만나보세요.
</p>
```

인라인 모드는 기존 요소와 텍스트를 유지하며 브라우저에서 개행을 계산합니다.

## 상태 변경과 강제 경계

```svelte
<script lang="ts">
  import { kowrap } from '@oddmash/juliya/svelte';

  let text = $state('모든 사람이 한국어를 읽는 흐름대로.');
  let force = $state(false);
  let forcedBreaks = $derived(force ? [text.indexOf('한국어')] : []);
</script>

<button onclick={() => force = !force}>개행 지정</button>
<p use:kowrap={{ text, forcedBreaks }}></p>
```

액션의 `update`는 새 옵션을 공통 브라우저 컨트롤러에 전달합니다. `destroy`는 컴포넌트 제거 시 관찰을 해제합니다. 텍스트가 바뀔 때 강제 경계가 유효한지 함께 확인하세요.

## SvelteKit와 SSR

액션은 브라우저에서 실행됩니다. 서버 최초 렌더링을 직접 관리하는 경우 코어 `splitLines`로 초기 값을 만들고 `observeKowrap`의 결과를 상태에 반영해 렌더링할 수 있습니다. 이 방법은 액션과 달리 DOM의 자식을 프레임워크가 계속 소유합니다.

자세한 방식은 [SSR과 하이드레이션](ssr.md)을 확인하세요.
