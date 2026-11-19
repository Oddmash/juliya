# Vue 3

Vue에서는 `kowrapDirective`로 DOM 요소의 줄바꿈을 관리합니다. kowrap 패키지에는 Vue 런타임이 포함되지 않습니다. 프로젝트가 이미 사용하는 Vue 3에서 작동합니다.

## 로컬 디렉티브

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';

const text = ref('자연스러운 한국어 줄바꿈을 경험하세요.');
</script>

<template>
  <p v-kowrap="{ text }" class="heading"></p>
</template>
```

`v-kowrap`이 지정된 요소의 자식 DOM은 kowrap에서 관리합니다. 따라서 텍스트를 Vue 보간으로 다시 렌더링하지 않고 디렉티브의 `text` 옵션으로만 전달합니다.

## 전역 등록

```ts
import { createApp } from 'vue';
import { kowrapDirective } from '@oddmash/kowrap/vue';
import App from './App.vue';

const app = createApp(App);
app.directive('kowrap', kowrapDirective);
app.mount('#app');
```

이후 각 템플릿에서 `v-kowrap`을 사용할 수 있습니다.

## 인라인 마크업

```vue
<p v-kowrap="{ inline: true }">
  읽기 좋은 <strong>한국어 <em>줄바꿈</em></strong>과
  <a href="/docs/">문서</a>를 만나보세요.
</p>
```

`inline: true`에서는 기존 자식 요소를 유지하며 Vue 업데이트 전에 삽입된 개행을 복원합니다.

## 반응형 옵션

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { kowrapDirective as vKowrap } from '@oddmash/kowrap/vue';

const text = ref('모든 사람이 자연스러운 한국어를 읽습니다.');
const force = ref(false);
const forcedBreaks = computed(() => {
  const offset = text.value.indexOf('한국어');
  return force.value && offset > 0 ? [offset] : [];
});
</script>

<template>
  <button type="button" @click="force = !force">강제 개행</button>
  <p v-kowrap="{ text, forcedBreaks, strategy: 'balanced' }"></p>
</template>
```

디렉티브는 요소가 마운트될 때 관찰을 시작하고 옵션이 변경되면 업데이트합니다. 요소가 제거될 때 컨트롤러를 해제합니다.

## Nuxt와 SSR

디렉티브는 클라이언트에서 실제 폭을 측정합니다. 서버에서 초기 텍스트를 보여줘야 한다면 `splitLines`로 만든 줄 데이터를 프레임워크의 템플릿에서 표시하고 클라이언트 `observeKowrap`으로 연결하세요. [SSR 초기 렌더링](ssr.md)을 참고합니다.
