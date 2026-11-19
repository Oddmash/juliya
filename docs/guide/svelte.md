# Svelte

Svelte에서는 `kowrap` 액션을 사용합니다. 라이브러리가 Svelte 런타임을 직접 의존하지 않으므로 기존 Svelte 프로젝트에 추가할 수 있습니다.

## 기본 액션

```svelte
<script lang="ts">
  import { kowrap } from '@oddmash/kowrap/svelte';

  let text = $state('자연스러운 한국어 줄바꿈을 경험하세요.');
</script>

<p use:kowrap={{ text }}></p>
```

액션이 관리하는 요소는 일반 문자열 전용 요소로 사용합니다. 자식 콘텐츠를 Svelte에서 동시에 변경하지 마세요.

## 상태 변경과 강제 경계

```svelte
<script lang="ts">
  import { kowrap } from '@oddmash/kowrap/svelte';

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
