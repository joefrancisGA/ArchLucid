"use client";

import dynamic from "next/dynamic";

import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const operatorTopBarLoading = (
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
);

/** TB-2118 — command palette / global search / mobile drawer off hub First Load JS. */
export const OperatorShellTopBarDeferred = dynamic(
  () => import("./OperatorShellTopBar").then((module) => module.OperatorShellTopBar),
  { ssr: false, loading: () => operatorTopBarLoading },
);

export const AppShellWorkspaceFooterDeferred = dynamic(
  () => import("./AppShellWorkspaceFooter").then((module) => module.AppShellWorkspaceFooter),
  { ssr: false, loading: () => null },
);

export const AppShellIdleOverlaysDeferred = dynamic(
  () => import("./AppShellIdleOverlays").then((module) => module.AppShellIdleOverlays),
  { ssr: false, loading: () => null },
);

export const DevTestingShellShortcutsDeferred = dynamic(
  () =>
    import("@/components/dev-testing/DevTestingShellShortcuts").then(
      (module) => module.DevTestingShellShortcuts,
    ),
  { ssr: false, loading: () => null },
);

export const AppShellTelemetryBundleDeferred = dynamic(
  () => import("./AppShellTelemetryBundle").then((module) => module.AppShellTelemetryBundle),
  { ssr: false, loading: () => null },
);

export const SessionIdleTimeoutGuardDeferred = dynamic(
  () =>
    import("@/components/SessionIdleTimeoutGuard").then((module) => module.SessionIdleTimeoutGuard),
  { ssr: false, loading: () => null },
);

export const AuthPanelDeferred = dynamic(
  () => import("@/components/AuthPanel").then((module) => module.AuthPanel),
  { ssr: false, loading: () => null },
);

export const SyncActiveRunFromPathnameDeferred = dynamic(
  () =>
    import("@/components/SyncActiveRunFromPathname").then((module) => module.SyncActiveRunFromPathname),
  { ssr: false, loading: () => null },
);

export const AppShellMainContentGateDeferred = dynamic(
  () => import("./AppShellMainContentGate").then((module) => module.AppShellMainContentGate),
  { ssr: false, loading: () => null },
);
