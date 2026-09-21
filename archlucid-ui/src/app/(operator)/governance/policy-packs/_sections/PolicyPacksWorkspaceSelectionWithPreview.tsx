"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { PolicyPackWorkspaceAttachPreviewDialog } from "@/components/policy/PolicyPackWorkspaceAttachPreviewDialog";
import { PolicyPacksWorkspaceSelectionSection } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import type { PolicyPacksWorkspaceSelectionSectionProps } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import { Button } from "@/components/ui/button";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parsePolicyPackToggleAssignmentIdFromSearch,
  parsePolicyPackToggleNextFromSearch,
  policyPackWorkspaceToggleConfirmHrefFromSearch,
} from "@/lib/policy/policy-pack-workspace-toggle-confirm-url";
import { cn } from "@/lib/utils";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

type PendingToggle = {
  readonly item: PolicyPackWorkspaceSelectionItem;
  readonly nextEnabled: boolean;
};

export type PolicyPacksWorkspaceSelectionWithPreviewProps = PolicyPacksWorkspaceSelectionSectionProps;

/** Workspace pack toggles with dry-run impact preview before attach/detach. */
export function PolicyPacksWorkspaceSelectionWithPreview(props: PolicyPacksWorkspaceSelectionWithPreviewProps) {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const packToggleAssignmentIdParam = searchParams.get("packToggleAssignmentId");
  const packToggleNextParam = searchParams.get("packToggleNext");
  const [pendingToggle, setPendingToggleState] = useState<PendingToggle | null>(null);
  const [undoToggle, setUndoToggle] = useState<PendingToggle | null>(null);

  const syncToggleConfirmToUrl = useCallback(
    (toggle: PendingToggle | null) => {
      router.replace(
        policyPackWorkspaceToggleConfirmHrefFromSearch(
          searchParams.toString(),
          toggle === null
            ? { assignmentId: null, next: null }
            : {
                assignmentId: toggle.item.assignmentId,
                next: toggle.nextEnabled ? "enable" : "disable",
              },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingToggle = useCallback(
    (value: SetStateAction<PendingToggle | null>) => {
      setPendingToggleState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncToggleConfirmToUrl(next);

        return next;
      });
    },
    [syncToggleConfirmToUrl],
  );

  useEffect(() => {
    const assignmentId = parsePolicyPackToggleAssignmentIdFromSearch(packToggleAssignmentIdParam);
    const next = parsePolicyPackToggleNextFromSearch(packToggleNextParam);

    if (assignmentId.length === 0 || next === null) {
      setPendingToggleState(null);

      return;
    }

    if (props.items.length === 0) {
      return;
    }

    const item = props.items.find((candidate) => candidate.assignmentId === assignmentId);

    if (item === undefined) {
      return;
    }

    const nextEnabled = next === "enable";

    if (
      pendingToggle?.item.assignmentId === assignmentId
      && pendingToggle.nextEnabled === nextEnabled
    ) {
      return;
    }

    setPendingToggleState({ item, nextEnabled });
  }, [packToggleAssignmentIdParam, packToggleNextParam, pendingToggle?.item.assignmentId, pendingToggle?.nextEnabled, props.items]);

  const onToggle = useCallback((assignmentId: string, nextEnabled: boolean) => {
    const item = props.items.find((candidate) => candidate.assignmentId === assignmentId) ?? null;

    if (item === null) {
      return;
    }

    setPendingToggle({ item, nextEnabled });
  }, [props.items, setPendingToggle]);

  const onConfirm = useCallback(async () => {
    if (pendingToggle === null) {
      return;
    }

    await props.onToggle(pendingToggle.item.assignmentId, pendingToggle.nextEnabled);
    setUndoToggle({
      item: pendingToggle.item,
      nextEnabled: !pendingToggle.nextEnabled,
    });
    setPendingToggle(null);
  }, [pendingToggle, props, setPendingToggle]);

  const onUndo = useCallback(async () => {
    if (undoToggle === null) {
      return;
    }

    await props.onToggle(undoToggle.item.assignmentId, undoToggle.nextEnabled);
    setUndoToggle(null);
  }, [props, undoToggle]);

  return (
    <>
      <PolicyPacksWorkspaceSelectionSection {...props} onToggle={onToggle} />
      {undoToggle !== null ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="policy-packs-workspace-toggle-undo"
          role="status"
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {undoToggle.nextEnabled ? "Re-enabled" : "Disabled"} <strong>{undoToggle.item.name}</strong> for this workspace.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void onUndo()}>
            Undo
          </Button>
        </div>
      ) : null}
      <PolicyPackWorkspaceAttachPreviewDialog
        open={pendingToggle !== null}
        item={pendingToggle?.item ?? null}
        nextEnabled={pendingToggle?.nextEnabled ?? true}
        onOpenChange={(open) => {
          if (!open) {
            setPendingToggle(null);
          }
        }}
        onConfirm={onConfirm}
      />
    </>
  );
}
