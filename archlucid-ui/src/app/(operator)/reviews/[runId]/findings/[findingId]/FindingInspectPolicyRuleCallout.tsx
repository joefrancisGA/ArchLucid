"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { FindingPolicyTraceabilityBadges } from "@/components/FindingPolicyTraceabilityBadges";
import { StatusTag } from "@/components/ui/status-tag";
import { getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import type {
  FindingPolicyCitationLink,
  FindingPolicyPackCitationLink,
} from "@/lib/finding-policy-evidence-citations";
import {
  buildPolicyRulePreviewFallback,
  lookupPolicyRulePreviewInEffectivePacks,
  type PolicyRulePreview,
} from "@/lib/policy-rule-preview-lookup";
import { policyPacksRuleHref } from "@/lib/policy-packs-deep-link";
import { cn } from "@/lib/utils";

export type FindingInspectPolicyRuleCalloutProps = {
  readonly pack: FindingPolicyPackCitationLink | null;
  readonly policy: FindingPolicyCitationLink;
  readonly className?: string;
};

function initialPreview(
  pack: FindingPolicyPackCitationLink | null,
  policy: FindingPolicyCitationLink,
): PolicyRulePreview {
  return buildPolicyRulePreviewFallback({
    ruleId: policy.ruleId,
    ruleLabel: policy.ruleLabel,
    packId: pack?.packId ?? null,
    packName: pack?.packName ?? null,
  });
}

/** Inline customer policy rule text shown before architecture evidence on finding inspect. */
export function FindingInspectPolicyRuleCallout(props: FindingInspectPolicyRuleCalloutProps): ReactElement {
  const { pack, policy, className } = props;
  const [preview, setPreview] = useState<PolicyRulePreview>(() => initialPreview(pack, policy));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const effective = await getEffectivePolicyPacks();
        const resolved =
          lookupPolicyRulePreviewInEffectivePacks(policy.ruleId, effective.packs) ??
          initialPreview(pack, policy);

        if (!cancelled) {
          setPreview(resolved);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load policy rule text.");
          setPreview(initialPreview(pack, policy));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pack, policy]);

  const violationLabel = pack !== null ? `Policy violation: ${pack.packName}` : "Policy violation";

  return (
    <div
      className={cn(
        "rounded-md border border-teal-300/80 bg-teal-50/90 p-4 dark:border-teal-800 dark:bg-teal-950/30",
        className,
      )}
      data-testid="finding-inspect-policy-rule-callout"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="needs-attention" label={violationLabel} data-testid="finding-inspect-policy-violation-tag" />
        <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Customer policy rule</p>
      </div>

      <div className="mt-3 space-y-3">
        <FindingPolicyTraceabilityBadges pack={pack} policy={policy} />

        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Rule ID
          </p>
          <p
            className="m-0 mt-1 font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100"
            data-testid="finding-inspect-policy-rule-id"
          >
            {preview.ruleId}
          </p>
        </div>

        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Rule text
          </p>
          <p
            className="m-0 mt-1 text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-100"
            data-testid="finding-inspect-policy-rule-text"
          >
            {preview.description}
          </p>
          {preview.remediationGuidance.trim().length > 0 ? (
            <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Remediation: </span>
              {preview.remediationGuidance}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" role="status">
            Loading policy pack rule text…
          </p>
        ) : null}

        {loadError !== null ? (
          <p className="m-0 text-xs text-rose-700 dark:text-rose-300" role="alert">
            {loadError}
          </p>
        ) : null}

        <Link
          href={policyPacksRuleHref(preview.ruleId)}
          className="inline-block text-xs font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100"
        >
          Open full rule in Policy Packs
        </Link>
      </div>
    </div>
  );
}
