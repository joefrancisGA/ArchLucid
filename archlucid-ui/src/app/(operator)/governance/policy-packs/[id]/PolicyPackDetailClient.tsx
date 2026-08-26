"use client";

import Link from "next/link";
import { useCallback, useMemo, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";

import { usePolicyPackDetailPageQuery } from "@/hooks/use-policy-pack-detail-page-query";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  buildPolicyPacksHrefWithReviewId,
  POLICY_PACKS_REVIEW_ID_QUERY_PARAM,
} from "@/lib/policy-packs-review-handoff";
import { policyPackDetailHref } from "@/lib/policy/policy-packs-deep-link";
import { resolvePolicyPackDetailKind } from "@/lib/policy/policy-pack-detail-resolver";
import { cn } from "@/lib/utils";
import type { PolicyPack, PolicyPackContentDocument, PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

import { PolicyPacksNextReviewFooterClient } from "../_sections/PolicyPacksNextReviewFooterClient";
import { HealthcareClaimsPolicyPackDetail } from "./HealthcareClaimsPolicyPackDetail";
import { PolicyPackDetailEvidenceChrome } from "./PolicyPackDetailEvidenceChrome";
import { PolicyPackDetailLoadError } from "./PolicyPackDetailLoadError";
import { PolicyPackDetailNextPackFooterClient } from "./PolicyPackDetailNextPackFooterClient";
import { PolicyPackGenericDetail } from "./PolicyPackGenericDetail";
import { PolicyPackDetailNotFound } from "./PolicyPackDetailNotFound";
import { ResponsibleAiPolicyPackDetail } from "./ResponsibleAiPolicyPackDetail";

type PolicyPackDetailClientProps = {
  readonly policyPackId: string;
};

type PolicyPackDetailChromeProps = {
  readonly policyPackId: string;
  readonly scopedReviewId: string;
  readonly children: ReactElement;
};

function PolicyPackDetailScopedChrome(props: PolicyPackDetailChromeProps): ReactElement {
  const scopedReviewId = props.scopedReviewId.trim();
  const scopedReviewFilterActive = scopedReviewId.length > 0;
  const clearScopeHref = policyPackDetailHref(props.policyPackId, null);

  return (
    <PolicyPackDetailEvidenceChrome>
      {scopedReviewFilterActive ? (
        <p
          className={cn("m-0 px-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="policy-pack-detail-review-scope-banner"
        >
          {"Inspecting policy packs for review "}
          <span className="font-mono text-al-text-primary">{scopedReviewId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={clearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(scopedReviewId)}`}
          >
            Open review
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={buildPolicyPacksHrefWithReviewId(scopedReviewId)}>
            Open policy packs hub
          </Link>
        </p>
      ) : null}
      {props.children}
      <div className="space-y-4 px-4 pb-4">
        <PolicyPackDetailNextPackFooterClient policyPackId={props.policyPackId} reviewId={scopedReviewId} />
        {scopedReviewFilterActive ? <PolicyPacksNextReviewFooterClient runId={scopedReviewId} /> : null}
      </div>
    </PolicyPackDetailEvidenceChrome>
  );
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
  const searchParams = useSearchParams();
  const scopedReviewId = (searchParams.get(POLICY_PACKS_REVIEW_ID_QUERY_PARAM) ?? "").trim();
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

  const wrapDetail = (node: ReactElement): ReactElement => (
    <PolicyPackDetailScopedChrome policyPackId={policyPackId} scopedReviewId={scopedReviewId}>
      {node}
    </PolicyPackDetailScopedChrome>
  );

  if (detailQuery.isPending) {
    return (
      <div className="p-4" data-testid="policy-pack-detail-loading">
        <p className="m-0 text-al-text-secondary">Loading policy pack…</p>
      </div>
    );
  }

  if (kind === "healthcare-claims") {
    return wrapDetail(<HealthcareClaimsPolicyPackDetail policyPackId={policyPackId} />);
  }

  if (kind === "responsible-ai") {
    return wrapDetail(
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
    return wrapDetail(<PolicyPackDetailLoadError onRetry={handleRetry} />);
  }

  if (packRecord !== null) {
    return wrapDetail(
      <PolicyPackGenericDetail
        policyPackId={policyPackId}
        packRecord={packRecord}
        packContent={packContent}
        isEnabled={isEnabled}
        isGloballyActive={isGloballyActive}
        scopedReviewId={scopedReviewId}
      />,
    );
  }

  return wrapDetail(<PolicyPackDetailNotFound policyPackId={policyPackId} />);
}
