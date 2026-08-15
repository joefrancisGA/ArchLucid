"use client";

import type { RefObject } from "react";

import {
  AppToasterDeferred,
  RouteAnnouncerDeferred,
} from "@/components/shell/app-shell-deferred-chunks";
import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { useOperatorShellAccessRedirects } from "@/hooks/useOperatorShellAccessRedirects";
import { OPERATOR_SHELL_MAIN_PADDING_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorShellDeferredChromeProps = {
  shellRootRef: RefObject<HTMLDivElement | null>;
};

/** Full-viewport neutral shell while access gates resolve — no sidebar or top bar (TB-730). */
export function OperatorShellDeferredChrome({ shellRootRef }: OperatorShellDeferredChromeProps) {
  useOperatorShellAccessRedirects();

  return (
    <>
      <div
        ref={shellRootRef}
        data-testid="operator-shell-access-gate-root"
        className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950"
      >
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(OPERATOR_SHELL_MAIN_PADDING_CLASS, "flex flex-1 flex-col outline-none focus:outline-none")}
        >
          <OperatorShellAccessGateLoading />
        </main>
      </div>
      <AppToasterDeferred />
      <RouteAnnouncerDeferred />
    </>
  );
}
