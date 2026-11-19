import type { WrapOptions, WrappedLine } from "../core/types.js";

export interface KowrapOptions extends Pick<WrapOptions, "strategy" | "breakLongWords" | "forcedBreaks"> {
  text: string;
}

export interface KowrapController {
  update: (options: KowrapOptions) => void;
  refresh: () => void;
  destroy: () => void;
}

export interface KowrapLayout {
  lines: WrappedLine[];
  measured: boolean;
}
