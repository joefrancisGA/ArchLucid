"use client";

import type { ReactNode } from "react";

import { GovernanceModeContext, useGovernanceModeState } from "@/hooks/use-governance-mode";

export function GovernanceModeProvider(props: { readonly children: ReactNode }) {
  const { children } = props;
  const value = useGovernanceModeState();

  return <GovernanceModeContext.Provider value={value}>{children}</GovernanceModeContext.Provider>;
}
