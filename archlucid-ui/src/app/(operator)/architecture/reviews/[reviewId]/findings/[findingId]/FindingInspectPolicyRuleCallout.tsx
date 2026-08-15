"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { StatusTag } from "@/components/ui/status-tag";
import { getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import type {
  FindingPolicyCitationLink,
  FindingPolicyPackCitationLink,
} from "@/lib/findings/finding-policy-evidence-citations";
import {
  buildPolicyRulePreviewFallback,
  lookupPolicyRulePreviewInEffectivePacks,
  type PolicyRulePreview,
} from "@/lib/policy/policy-rule-preview-lookup";
import { policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
    let canceled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const effective = await getEffectivePolicyPacks();
        const resolved =
          lookupPolicyRulePreviewInEffectivePacks(policy.ruleId, effective.packs) ??
          initialPreview(pack, policy);

        if (!canceled) {
          setPreview(resolved);
        }
      } catch (error) {
        if (!canceled) {
          setLoadError(error instanceof Error ? error.message : "Could not load policy rule text.");
          setPreview(initialPreview(pack, policy));
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
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
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Customer policy rule</p>
      </div>

      <div className="mt-3 space-y-3">
        <FindingPolicyTraceabilityBadges pack={pack} policy={policy} />

        <div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
            Rule ID
          </p>
          <p
            className={cn("m-0 mt-1 font-mono font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="finding-inspect-policy-rule-id"
          >
            {preview.ruleId}
          </p>
        </div>

        <div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
            Rule text
          </p>
          <p
            className={cn("m-0 mt-1 font-medium leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="finding-inspect-policy-rule-text"
          >
            {preview.description}
          </p>
          {preview.remediationGuidance.trim().length > 0 ? (
            <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium text-al-text-primary">Remediation: </span>
              {preview.remediationGuidance}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
            Loading policy pack rule text…
          </p>
        ) : null}

        {loadError !== null ? (
          <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            {loadError}
          </p>
        ) : null}

        <Link
          href={policyPacksRuleHref(preview.ruleId)}
          className={cn("inline-block", OPERATOR_LINK.optional)}
        >
          Open full rule in Policy Packs
        </Link>
      </div>
    </div>
  );
}
