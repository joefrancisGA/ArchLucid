"use client";

import { useCallback, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { listPolicyPackWorkspaceSelection, setPolicyPackAssignmentEnabled } from "@/lib/api";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

export type PolicyPacksWorkspaceSelectionControls = {
  readonly canMutatePacks: boolean;
  readonly load: () => Promise<void>;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
};

export type PolicyPacksWorkspaceSelectionSlice = {
  readonly workspaceSelectionItems: PolicyPackWorkspaceSelectionItem[];
  readonly workspaceSelectionLoading: boolean;
  readonly togglingAssignmentId: string | null;
  readonly refreshWorkspaceSelection: () => Promise<void>;
  readonly onToggleWorkspaceSelection: (assignmentId: string, nextEnabled: boolean) => Promise<void>;
};

export function usePolicyPacksWorkspaceSelection(
  controls: PolicyPacksWorkspaceSelectionControls,
): PolicyPacksWorkspaceSelectionSlice {
  const [workspaceSelectionItems, setWorkspaceSelectionItems] = useState<PolicyPackWorkspaceSelectionItem[]>([]);
  const [workspaceSelectionLoading, setWorkspaceSelectionLoading] = useState(false);
  const [togglingAssignmentId, setTogglingAssignmentId] = useState<string | null>(null);

  const refreshWorkspaceSelection = useCallback(async () => {
    setWorkspaceSelectionLoading(true);

    try {
      const rows = await listPolicyPackWorkspaceSelection();
      setWorkspaceSelectionItems(rows);
    } catch {
      setWorkspaceSelectionItems([]);
    } finally {
      setWorkspaceSelectionLoading(false);
    }
  }, []);

  const onToggleWorkspaceSelection = useCallback(
    async (assignmentId: string, nextEnabled: boolean) => {
      if (!controls.canMutatePacks) {
        return;
      }

      setTogglingAssignmentId(assignmentId);
      controls.setFailure(null);

      try {
        await setPolicyPackAssignmentEnabled(assignmentId, nextEnabled);
        await controls.load();
      } catch (e) {
        controls.setFailure(toApiLoadFailure(e));
      } finally {
        setTogglingAssignmentId(null);
      }
    },
    [controls],
  );

  return {
    workspaceSelectionItems,
    workspaceSelectionLoading,
    togglingAssignmentId,
    refreshWorkspaceSelection,
    onToggleWorkspaceSelection,
  };
}
