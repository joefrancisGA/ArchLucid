"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";

/**
 * Surfaces query-string intent from {@link PostCommitRetentionRail} next-cycle dialog — lineage attachment remains API-owned.
 */
export function NewReviewIntentCallout() {
  const searchParams = useSearchParams();
  const intent: string = searchParams.get("intent")?.trim() ?? "";
  const cloneFrom: string = searchParams.get("cloneFromRunId")?.trim() ?? "";
  const policyPackId: string = searchParams.get(POLICY_PACK_ID_QUERY_PARAM)?.trim() ?? "";

  if (policyPackId.length > 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="reviews-new-policy-pack-intent-callout"
      >
        <strong className="font-semibold">Policy pack pre-selected.</strong> This review includes policy pack{" "}
        <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{policyPackId}</span> in its policy references.
        Confirm the pack is enabled in your workspace —{" "}
        <Link
          href={`${GOVERNANCE_POLICY_PACKS_PATH}/${encodeURIComponent(policyPackId)}`}
          className={OPERATOR_LINK.nav}
        >
          open pack detail
        </Link>
        .
      </div>
    );
  }

  if (intent === "revised-clone" && cloneFrom.length > 0) {
    return (
      <div
        className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
        role="status"
      >
        <strong className="font-semibold">Revised review (carry-forward).</strong> Started from review{" "}
        <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{cloneFrom}</span>. Finish the wizard — prior-manifest linkage follows tenant
        capability.
      </div>
    );
  }

  if (intent === "revised-fresh") {
    return (
      <div
        className={cn(
          "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
      >
        <strong className="font-semibold">Revised review (fresh start).</strong> This pass does not assume attachment to a
        prior manifest — supply a new brief when prompted.
      </div>
    );
  }

  return null;
}
