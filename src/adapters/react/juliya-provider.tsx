"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { WrapLocale } from "../../core/types.js";

export interface JuliyaProviderProps {
  locale?: WrapLocale;
  children: ReactNode;
}

const LocaleContext = createContext<WrapLocale | undefined>(undefined);

export const useJuliyaLocale = (locale?: WrapLocale) => {
  const inheritedLocale = useContext(LocaleContext);
  return locale ?? inheritedLocale;
};

export const JuliyaProvider = ({ locale, children }: JuliyaProviderProps) => {
  const resolvedLocale = useJuliyaLocale(locale);
  return <LocaleContext.Provider value={resolvedLocale}>{children}</LocaleContext.Provider>;
};
