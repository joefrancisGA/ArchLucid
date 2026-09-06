"use client";

import { useCallback, useState, type ReactElement, type SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { GuidedModeSwitchToWorkingDialog } from "@/components/workspace-mode/GuidedModeSwitchToWorkingDialog";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_TYPOGRAPHY, enterpriseStatusTagClass } from "@/lib/design-tokens";
import { showInfo } from "@/lib/toast";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import {
  WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_DETAIL,
  WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL,
  WORKSPACE_MODE_SWITCHED_TO_WORKING_TOAST,
} from "@/lib/workspace-mode/workspace-mode-copy";
import { cn } from "@/lib/utils";
import {
  parseWorkspaceModeSwitchConfirmOpenFromSearch,
  workspaceModeSwitchConfirmHrefFromSearch,
} from "@/lib/operator/workspace-mode-switch-confirm-url";

export type GuidedModeTopBarChipProps = {
  readonly className?: string;
};

/** Persistent Guided-mode indicator in the operator shell top bar. */
export function GuidedModeTopBarChip(props: GuidedModeTopBarChipProps): ReactElement | null {
  const { mode, mounted, setAndPersist } = useWorkspaceMode();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const workspaceSwitchConfirmParam = searchParams.get("workspaceSwitchConfirm");
  const [dialogOpen, setDialogOpenState] = useState(() =>
    parseWorkspaceModeSwitchConfirmOpenFromSearch(workspaceSwitchConfirmParam),
  );

  const syncWorkspaceSwitchConfirmToUrl = useCallback(
    (confirmOpen: boolean) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        workspaceModeSwitchConfirmHrefFromSearch(searchParams.toString(), confirmOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncWorkspaceSwitchConfirmToUrl(next);

        return next;
      });
    },
    [syncWorkspaceSwitchConfirmToUrl],
  );

  if (!mounted || !isGuidedWorkspaceMode(mode)) {
    return null;
  }

  const chipClassName = cn(
    enterpriseStatusTagClass("in-progress"),
    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1",
    OPERATOR_TYPOGRAPHY.badge,
    "font-medium",
  );

  return (
    <>
      <span
        className={cn("inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 sm:max-w-none", props.className)}
        data-testid="guided-mode-top-bar-chip"
      >
        <button
          type="button"
          className={cn(
            chipClassName,
            "cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
          )}
          aria-label={`${WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL} — click to switch`}
          data-testid="guided-mode-top-bar-chip-trigger"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full bg-[var(--al-accent-interactive)]"
          />
          {WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL}
          <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </button>
        <FieldHelpTooltip label={WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL} hint={WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_DETAIL} />
      </span>
      <GuidedModeSwitchToWorkingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSwitchToWorking={() => {
          setAndPersist("working");
          setDialogOpen(false);
          showInfo(WORKSPACE_MODE_SWITCHED_TO_WORKING_TOAST);
        }}
      />
    </>
  );
}
