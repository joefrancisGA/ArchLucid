"use client";

import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { RemediationFactoryRankedPathAskHandoff } from "@/components/remediation-factory/RemediationFactoryRankedPathAskHandoff";
import {
  RESOURCE_HUB_SECURITY_EVIDENCE_PATH_ID_PARAM,
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
  parseResourceHubQueryValueFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { GOVERNANCE_FINDINGS_QUEUE_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/governance/governance-findings-queue-ranked-path-ask-handoff-copy";
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
  const secureNowFindingsDesk = isSecureNowProductLine(productLine);
  const partialCapture = useLatestSnapshotCaptureIsPartial(secureNowFindingsDesk);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const urlSecurityEvidencePathId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_SECURITY_EVIDENCE_PATH_ID_PARAM),
  );
  const urlSnapshotId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const askSnapshotId = urlSnapshotId.length > 0 ? urlSnapshotId : partialCaptureSnapshotId;
  const pathInspectPanelRef = useRef<HTMLElement | null>(null);

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
    <>
      {urlSecurityEvidencePathId.length > 0 ? (
        <RemediationFactoryRankedPathAskHandoff
          testId="governance-findings-ranked-path-ask-handoff"
          snapshotId={askSnapshotId}
          securityEvidencePathId={urlSecurityEvidencePathId}
          disabled={partialCapture}
          hubTab="findings"
          scopeLine={GOVERNANCE_FINDINGS_QUEUE_RANKED_PATH_ASK_SCOPE_LINE}
        />
      ) : null}
      <SecurityEvidencePathInspectPanel
      findingId={pathInspectFindingId}
      panelRef={pathInspectPanelRef}
      selectPromptPreset={selectPromptPreset}
      showFocusPathInspectShortcutHint
      pathIdOverride={urlSecurityEvidencePathId.length > 0 ? urlSecurityEvidencePathId : undefined}
    />
    </>
  );
}
