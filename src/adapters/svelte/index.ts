import { mountKowrap } from "../../dom/render.js";
import type { MountKowrapOptions } from "../../dom/types.js";

export const kowrap = (element: HTMLElement, options: MountKowrapOptions) => {
  const controller = mountKowrap(element, options);
  return { update: controller.update, destroy: controller.destroy };
};

export type { KowrapOptions, InlineKowrapOptions, MountKowrapOptions } from "../../dom/types.js";
