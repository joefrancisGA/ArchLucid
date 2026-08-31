"use client";

import { useCallback, useState } from "react";

import { PolicyPackWorkspaceAttachPreviewDialog } from "@/components/policy/PolicyPackWorkspaceAttachPreviewDialog";
import { PolicyPacksWorkspaceSelectionSection } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import type { PolicyPacksWorkspaceSelectionSectionProps } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

type PendingToggle = {
  readonly item: PolicyPackWorkspaceSelectionItem;
  readonly nextEnabled: boolean;
};

export type PolicyPacksWorkspaceSelectionWithPreviewProps = PolicyPacksWorkspaceSelectionSectionProps;

/** Workspace pack toggles with dry-run impact preview before attach/detach. */
export function PolicyPacksWorkspaceSelectionWithPreview(props: PolicyPacksWorkspaceSelectionWithPreviewProps) {
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  const onToggle = useCallback((assignmentId: string, nextEnabled: boolean) => {
    const item = props.items.find((candidate) => candidate.assignmentId === assignmentId) ?? null;

    if (item === null) {
      return;
    }

    setPendingToggle({ item, nextEnabled });
  }, [props.items]);

  const onConfirm = useCallback(async () => {
    if (pendingToggle === null) {
      return;
    }

    await props.onToggle(pendingToggle.item.assignmentId, pendingToggle.nextEnabled);
    setPendingToggle(null);
  }, [pendingToggle, props]);

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
