"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { PolicyPackWorkspaceAttachPreviewDialog } from "@/components/policy/PolicyPackWorkspaceAttachPreviewDialog";
import { PolicyPacksWorkspaceSelectionSection } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import type { PolicyPacksWorkspaceSelectionSectionProps } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  parsePolicyPackToggleAssignmentIdFromSearch,
  parsePolicyPackToggleNextFromSearch,
  policyPackWorkspaceToggleConfirmHrefFromSearch,
} from "@/lib/policy/policy-pack-workspace-toggle-confirm-url";
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
    setPendingToggle(null);
  }, [pendingToggle, props, setPendingToggle]);

  return (
    <>
      <PolicyPacksWorkspaceSelectionSection {...props} onToggle={onToggle} />
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
