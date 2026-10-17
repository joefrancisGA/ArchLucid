"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { GOVERNANCE_ASSIGNED_TO_ME_PATH_INSPECT_SELECT_PROMPT } from "@/lib/governance/governance-assigned-to-me-path-inspect-empty-states";
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

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceAssignedToMePathInspectSection(
  props: Pick<
    GovernanceFindingsQueueAssignedToMeShellProps,
    "isAssignedToMe" | "rows" | "selectedFindingIds"
  >,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const searchParams = useSearchParams();

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

  if (!props.isAssignedToMe || !isSecureNowProductLine(productLine)) {
    return null;
  }

  return (
    <SecurityEvidencePathInspectPanel
      findingId={pathInspectFindingId}
      selectPromptPreset={GOVERNANCE_ASSIGNED_TO_ME_PATH_INSPECT_SELECT_PROMPT}
    />
  );
}
