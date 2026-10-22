"use client";

import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import {
  GOVERNANCE_ASSIGNED_TO_ME_PATH_INSPECT_SELECT_PROMPT,
  GOVERNANCE_FINDINGS_QUEUE_PATH_INSPECT_SELECT_PROMPT,
} from "@/lib/governance/governance-assigned-to-me-path-inspect-empty-states";
import {
  governanceAssignedToMePathInspectFindingIdSet,
  resolveGovernanceAssignedToMePathInspectFindingId,
} from "@/lib/governance/resolve-governance-assigned-to-me-path-inspect-finding-id";
import {
  parseRemediationFactoryFindingIdFromSearch,
  REMEDIATION_FACTORY_FINDING_ID_PARAM,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-url-state";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  focusGovernanceFindingsQueuePathInspectPanel,
  useGovernanceFindingsQueuePathInspectShortcuts,
} from "@/hooks/use-governance-findings-queue-path-inspect-shortcuts";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceAssignedToMePathInspectSection(
  props: Pick<
    GovernanceFindingsQueueAssignedToMeShellProps,
    "isAssignedToMe" | "rows" | "selectedFindingIds"
  >,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const searchParams = useSearchParams();
  const pathInspectPanelRef = useRef<HTMLElement | null>(null);
  const secureNowFindingsDesk = isSecureNowProductLine(productLine);

  const onFocusPathInspect = useCallback(() => {
    focusGovernanceFindingsQueuePathInspectPanel(pathInspectPanelRef.current);
  }, []);

  useGovernanceFindingsQueuePathInspectShortcuts({
    enabled: secureNowFindingsDesk,
    onFocusPathInspect,
  });

  const availableFindingIds = useMemo(
    () => governanceAssignedToMePathInspectFindingIdSet(props.rows),
    [props.rows],
  );

  const pathInspectFindingId = useMemo(
    () =>
      resolveGovernanceAssignedToMePathInspectFindingId({
        selectedFindingIds: props.selectedFindingIds,
        urlFindingId: parseRemediationFactoryFindingIdFromSearch(
          searchParams.get(REMEDIATION_FACTORY_FINDING_ID_PARAM),
        ),
        availableFindingIds,
      }),
    [availableFindingIds, props.selectedFindingIds, searchParams],
  );

  if (!secureNowFindingsDesk) {
    return null;
  }

  const selectPromptPreset = props.isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_PATH_INSPECT_SELECT_PROMPT
    : GOVERNANCE_FINDINGS_QUEUE_PATH_INSPECT_SELECT_PROMPT;

  return (
    <SecurityEvidencePathInspectPanel
      findingId={pathInspectFindingId}
      panelRef={pathInspectPanelRef}
      selectPromptPreset={selectPromptPreset}
      showFocusPathInspectShortcutHint
    />
  );
}
