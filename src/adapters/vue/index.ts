import { mountKowrap } from "../../dom/render.js";
import type { KowrapController, MountKowrapOptions } from "../../dom/types.js";

interface Binding {
  value: MountKowrapOptions;
}

const mounted = new WeakMap<HTMLElement, KowrapController>();

export const kowrapDirective = {
  mounted: (element: HTMLElement, binding: Binding) => {
    mounted.get(element)?.destroy();
    mounted.set(element, mountKowrap(element, binding.value));
  },
  updated: (element: HTMLElement, binding: Binding) => mounted.get(element)?.update(binding.value),
  beforeUpdate: (element: HTMLElement) => mounted.get(element)?.restore?.(),
  beforeUnmount: (element: HTMLElement) => {
    mounted.get(element)?.destroy();
    mounted.delete(element);
  },
};

export type { KowrapOptions, InlineKowrapOptions, MountKowrapOptions } from "../../dom/types.js";
