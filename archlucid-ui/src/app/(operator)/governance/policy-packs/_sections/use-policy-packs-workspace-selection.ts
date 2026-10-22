"use client";

import { useCallback, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { listPolicyPackWorkspaceSelection, setPolicyPackAssignmentEnabled, setPolicyPackAssignmentOrganizationRequired, archivePolicyPackAssignment } from "@/lib/api";
import { policyPackArchiveMutationBlockedReason } from "@/lib/policy/policy-pack-archive-mutation-blocked-reason";
import { policyPackMutationBlockedReason } from "@/lib/policy/policy-pack-mutation-blocked-reason";
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
  readonly togglingOrganizationRequiredAssignmentId: string | null;
  readonly archivingAssignmentId: string | null;
  readonly refreshWorkspaceSelection: () => Promise<void>;
  readonly onToggleWorkspaceSelection: (assignmentId: string, nextEnabled: boolean) => Promise<void>;
  readonly onToggleOrganizationRequired: (assignmentId: string, nextOrganizationRequired: boolean) => Promise<void>;
  readonly onArchiveAssignment: (assignmentId: string) => Promise<void>;
};

export function usePolicyPacksWorkspaceSelection(
  controls: PolicyPacksWorkspaceSelectionControls,
): PolicyPacksWorkspaceSelectionSlice {
  const [workspaceSelectionItems, setWorkspaceSelectionItems] = useState<PolicyPackWorkspaceSelectionItem[]>([]);
  const [workspaceSelectionLoading, setWorkspaceSelectionLoading] = useState(false);
  const [togglingAssignmentId, setTogglingAssignmentId] = useState<string | null>(null);
  const [togglingOrganizationRequiredAssignmentId, setTogglingOrganizationRequiredAssignmentId] = useState<string | null>(null);
  const [archivingAssignmentId, setArchivingAssignmentId] = useState<string | null>(null);

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
        const failure = toApiLoadFailure(e);
        const blocked = policyPackMutationBlockedReason(failure);
        controls.setFailure(blocked !== null ? { ...failure, message: blocked } : failure);
      } finally {
        setTogglingAssignmentId(null);
      }
    },
    [controls],
  );

  const onToggleOrganizationRequired = useCallback(
    async (assignmentId: string, nextOrganizationRequired: boolean) => {
      if (!controls.canMutatePacks) {
        return;
      }

      setTogglingOrganizationRequiredAssignmentId(assignmentId);
      controls.setFailure(null);

      try {
        await setPolicyPackAssignmentOrganizationRequired(assignmentId, nextOrganizationRequired);
        await controls.load();
      } catch (e) {
        const failure = toApiLoadFailure(e);
        const blocked = policyPackMutationBlockedReason(failure);
        controls.setFailure(blocked !== null ? { ...failure, message: blocked } : failure);
      } finally {
        setTogglingOrganizationRequiredAssignmentId(null);
      }
    },
    [controls],
  );

  const onArchiveAssignment = useCallback(
    async (assignmentId: string) => {
      if (!controls.canMutatePacks) {
        return;
      }

      setArchivingAssignmentId(assignmentId);
      controls.setFailure(null);

      try {
        await archivePolicyPackAssignment(assignmentId);
        await controls.load();
        await refreshWorkspaceSelection();
      } catch (e) {
        const failure = toApiLoadFailure(e);
        const blocked = policyPackArchiveMutationBlockedReason(failure);
        controls.setFailure(blocked !== null ? { ...failure, message: blocked } : failure);
      } finally {
        setArchivingAssignmentId(null);
      }
    },
    [controls, refreshWorkspaceSelection],
  );

  return {
    workspaceSelectionItems,
    workspaceSelectionLoading,
    togglingAssignmentId,
    togglingOrganizationRequiredAssignmentId,
    archivingAssignmentId,
    refreshWorkspaceSelection,
    onToggleWorkspaceSelection,
    onToggleOrganizationRequired,
    onArchiveAssignment,
  };
}
