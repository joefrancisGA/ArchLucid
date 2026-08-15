"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { GovernanceModeProvider } from "@/components/governance/GovernanceModeProvider";
import { ItsmNativeCreateReadinessProvider } from "@/components/itsm/ItsmNativeCreateReadinessProvider";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import { cn } from "@/lib/utils";

const operatorShellLoading = (
  <div
    className="flex min-h-dvh flex-col bg-neutral-50 dark:bg-neutral-950"
    aria-busy="true"
    aria-label="Loading workspace"
    data-testid="operator-shell-deferred-loading"
  >
    <header
      className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
      aria-hidden
    >
      <div
        className={cn(
          OPERATOR_SHELL_MAX_WIDTH_CLASS,
          OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
          "flex h-14 animate-pulse items-center justify-between gap-3",
        )}
      >
        <div className="h-8 w-40 rounded-md bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-56 rounded-md bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </header>
    <div className="flex flex-1 animate-pulse p-4">
      <div className="hidden h-64 w-56 rounded-md bg-neutral-200 dark:bg-neutral-800 lg:block" />
      <div className="ml-0 flex-1 rounded-md bg-neutral-100 dark:bg-neutral-900 lg:ml-4" />
    </div>
  </div>
);

const AppShellClientDeferred = dynamic(
  deferredChunkLoader(() => import("@/components/AppShellClient").then((module) => module.AppShellClient)),
  {
    ssr: false,
    loading: () => operatorShellLoading,
  },
);

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
