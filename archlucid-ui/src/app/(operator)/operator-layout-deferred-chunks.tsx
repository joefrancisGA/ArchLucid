"use client";

import type { ComponentType, JSX, ReactNode } from "react";

import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

const operatorShellLoadingWrapper = (): JSX.Element => (
  <div
    className="flex min-h-dvh flex-col bg-neutral-50 dark:bg-neutral-950"
    aria-busy="true"
    aria-label="Loading workspace"
    role="status"
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

/** TB-2371 — AppShellClient off operator layout parent chunk. */
export const AppShellClientDeferred: ComponentType<{ readonly children: ReactNode }> =
  createDeferredComponentFromManifest("app-shell-client", {
    loadingWrapper: operatorShellLoadingWrapper,
  }) as ComponentType<{ readonly children: ReactNode }>;
