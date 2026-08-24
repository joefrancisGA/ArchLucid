"use client";

import { useCallback, useMemo, type ReactElement } from "react";

import { usePolicyPackDetailPageQuery } from "@/hooks/use-policy-pack-detail-page-query";
import { resolvePolicyPackDetailKind } from "@/lib/policy/policy-pack-detail-resolver";
import type { PolicyPack, PolicyPackContentDocument, PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

import { HealthcareClaimsPolicyPackDetail } from "./HealthcareClaimsPolicyPackDetail";
import { PolicyPackDetailEvidenceChrome } from "./PolicyPackDetailEvidenceChrome";
import { PolicyPackDetailLoadError } from "./PolicyPackDetailLoadError";
import { PolicyPackGenericDetail } from "./PolicyPackGenericDetail";
import { PolicyPackDetailNotFound } from "./PolicyPackDetailNotFound";
import { ResponsibleAiPolicyPackDetail } from "./ResponsibleAiPolicyPackDetail";

type PolicyPackDetailClientProps = {
  readonly policyPackId: string;
};

function withEvidenceChrome(node: ReactElement): ReactElement {
  return <PolicyPackDetailEvidenceChrome>{node}</PolicyPackDetailEvidenceChrome>;
}

function resolveWorkspaceEnablement(
  policyPackId: string,
  workspaceSelection: readonly PolicyPackWorkspaceSelectionItem[],
): { isEnabled: boolean; isGloballyActive: boolean } {
  const match =
    workspaceSelection.find((row) => row.policyPackId.trim() === policyPackId.trim()) ?? null;

  return {
    isEnabled: match?.isEnabled ?? false,
    isGloballyActive: match?.isGloballyActive ?? false,
  };
}

/**
 * Detail shell for `/governance/policy-packs/[id]` — sponsor-grade pack narratives for known packs,
 * API-enriched metadata when available, and a polished not-found state otherwise.
 */
export function PolicyPackDetailClient(props: PolicyPackDetailClientProps): React.JSX.Element {
  const { policyPackId } = props;
  const detailQuery = usePolicyPackDetailPageQuery(policyPackId);

  const handleRetry = useCallback(() => {
    void detailQuery.refetch();
  }, [detailQuery]);

  const packRecord: PolicyPack | null = detailQuery.data?.packRecord ?? null;
  const packContent: PolicyPackContentDocument | null = detailQuery.data?.packContent ?? null;
  const workspaceSelection = useMemo(
    () => [...(detailQuery.data?.workspaceSelection ?? [])],
    [detailQuery.data?.workspaceSelection],
  );
  const kind = resolvePolicyPackDetailKind(policyPackId, packRecord);
  const { isEnabled, isGloballyActive } = resolveWorkspaceEnablement(policyPackId, workspaceSelection);

  if (detailQuery.isPending) {
    return (
      <div className="p-4" data-testid="policy-pack-detail-loading">
        <p className="m-0 text-al-text-secondary">Loading policy pack…</p>
      </div>
    );
  }

  if (kind === "healthcare-claims") {
    return withEvidenceChrome(<HealthcareClaimsPolicyPackDetail policyPackId={policyPackId} />);
  }

  if (kind === "responsible-ai") {
    return withEvidenceChrome(
      <ResponsibleAiPolicyPackDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        packContent={packContent}
        isEnabled={isEnabled}
        isGloballyActive={isGloballyActive}
      />,
    );
  }

  if (detailQuery.isError) {
    return withEvidenceChrome(<PolicyPackDetailLoadError onRetry={handleRetry} />);
  }

  if (packRecord !== null) {
    return withEvidenceChrome(
      <PolicyPackGenericDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        packContent={packContent}
        isEnabled={isEnabled}
        isGloballyActive={isGloballyActive}
      />,
    );
  }

  return withEvidenceChrome(<PolicyPackDetailNotFound policyPackId={policyPackId} />);
}
