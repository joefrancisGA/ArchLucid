"use client";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  DeploymentBuildFingerprintStripDeferred,
  SystemHealthStatusStripDeferred,
  TrustCenterShellLinkDeferred,
} from "./app-shell-workspace-footer-deferred-chunks";

type AppShellWorkspaceFooterProps = {
  readonly hideWorkspaceHealthFooter: boolean;
};

/** Workspace trust/health footer loaded outside the shell first-paint path (TB-696). */
export function AppShellWorkspaceFooter({ hideWorkspaceHealthFooter }: AppShellWorkspaceFooterProps) {
  if (isBuyerPolishedOperatorShellEnv()) {
    // Governance and other dense operator surfaces already carry trust links in help/header chrome.
    if (hideWorkspaceHealthFooter) {
      return null;
    }

    return (
      <footer
        className="border-t border-neutral-200 bg-neutral-50/90 py-2 print:hidden dark:border-neutral-800 dark:bg-neutral-950/90"
        aria-label="Trust and compliance"
      >
        <div
          className={cn(
            OPERATOR_SHELL_MAX_WIDTH_CLASS,
            OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
            "flex items-center gap-3",
          )}
        >
          <DeploymentBuildFingerprintStripDeferred variant="compact" />
          <TrustCenterShellLinkDeferred variant="footer" className="ml-auto" />
        </div>
      </footer>
    );
  }

  if (isNextPublicDemoMode() || hideWorkspaceHealthFooter) {
    return null;
  }

  return (
    <footer
      className="border-t border-neutral-200 bg-neutral-50/90 py-2 print:hidden dark:border-neutral-800 dark:bg-neutral-950/90"
      aria-label="Workspace footer"
    >
      <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, "flex flex-col gap-1")}>
        <SystemHealthStatusStripDeferred className="mb-0 min-w-0 flex-1" />
        <DeploymentBuildFingerprintStripDeferred />
      </div>
    </footer>
  );
}
