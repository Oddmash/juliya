import { mountKowrap } from "../../dom/render.js";
import type { KowrapOptions } from "../../dom/types.js";

export const kowrap = (element: HTMLElement, options: KowrapOptions) => {
  const controller = mountKowrap(element, options);
  return { update: controller.update, destroy: controller.destroy };
};

export type { KowrapOptions } from "../../dom/types.js";
