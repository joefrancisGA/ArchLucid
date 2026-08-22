"use client";

import type { ReactNode } from "react";

import { GovernanceModeProvider } from "@/components/governance/GovernanceModeProvider";
import { ItsmNativeCreateReadinessProvider } from "@/components/itsm/ItsmNativeCreateReadinessProvider";

import { AppShellClientDeferred } from "./operator-layout-deferred-chunks";

/** Client boundary for operator routes — keeps AppShellClient off the layout parent chunk. */
export function OperatorLayoutClient(props: { readonly children: ReactNode }) {
  return (
    <GovernanceModeProvider>
      <ItsmNativeCreateReadinessProvider>
        <AppShellClientDeferred>{props.children}</AppShellClientDeferred>
      </ItsmNativeCreateReadinessProvider>
    </GovernanceModeProvider>
  );
}
