import type { WrapOptions, WrappedLine } from "../core/types.js";

export interface KowrapOptions extends Pick<WrapOptions, "strategy" | "breakLongWords" | "forcedBreaks"> {
  text: string;
  inline?: false;
}

export interface InlineKowrapOptions extends Pick<WrapOptions, "strategy" | "breakLongWords" | "forcedBreaks"> {
  inline: true;
  text?: never;
}

export type MountKowrapOptions = KowrapOptions | InlineKowrapOptions;

export interface KowrapController {
  update: (options: MountKowrapOptions) => void;
  refresh: () => void;
  destroy: () => void;
  restore?: () => void;
}

export interface KowrapLayout {
  lines: WrappedLine[];
  measured: boolean;
}
