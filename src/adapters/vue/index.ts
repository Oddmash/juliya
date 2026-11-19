import { mountKowrap } from "../../dom/render.js";
import type { KowrapController, KowrapOptions } from "../../dom/types.js";

interface Binding {
  value: KowrapOptions;
}

const mounted = new WeakMap<HTMLElement, KowrapController>();

export const kowrapDirective = {
  mounted: (element: HTMLElement, binding: Binding) => {
    mounted.get(element)?.destroy();
    mounted.set(element, mountKowrap(element, binding.value));
  },
  updated: (element: HTMLElement, binding: Binding) => mounted.get(element)?.update(binding.value),
  beforeUnmount: (element: HTMLElement) => {
    mounted.get(element)?.destroy();
    mounted.delete(element);
  },
};

export type { KowrapOptions } from "../../dom/types.js";
