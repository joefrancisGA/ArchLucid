"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { BUYER_OPEN_SIGNED_RECORD_CTA, BUYER_POLICY_PACK_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { resolveHealthcareClaimsPolicyRuleRows } from "@/lib/policy/healthcare-claims-policy-pack-rules";
import {
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
  policyPackTypeDisplayLabel,
} from "@/lib/policy/policy-pack-type-label";
import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

import { HealthcareClaimsPolicyPackTechnicalDetailsDisclosure } from "./HealthcareClaimsPolicyPackTechnicalDetailsDisclosure";
import { PolicyPackRulesTableSection } from "./PolicyPackRulesTableSection";

const HEALTHCARE_CLAIMS_WORKING_LEAD =
  "Enterprise privacy pack for healthcare intake modernization — published rule families, evidence expectations, and governance linkage.";

const HEALTHCARE_CLAIMS_RULES_INTRO =
  "Rule families reviewers use when evaluating healthcare intake modernization evidence.";

type HealthcareClaimsPolicyPackDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack | null;
  readonly packContent: PolicyPackContentDocument | null;
  readonly isEnabled: boolean;
  readonly isGloballyActive: boolean;
  readonly packsHubHref?: string;
  readonly findingsHref?: string;
};

function resolveAssignedScopesLabel(isEnabled: boolean, isGloballyActive: boolean): string {
  if (isEnabled) {
    return "Workspace";
  }

  if (isGloballyActive) {
    return "Available globally";
  }

  return "Not assigned";
}

function resolvePackProvenanceLabel(packRecord: PolicyPack | null): string {
  const packType = packRecord?.packType?.trim() ?? "";

  if (packType.length > 0) {
    return policyPackTypeDisplayLabel(packType);
  }

  return policyPackTypeDisplayLabel(POLICY_PACK_TYPE_PLATFORM_DEFAULT);
}

/**
 * Sponsor-grade Healthcare Claims pack narrative aligned with the Claims Intake modernization sample review.
 */
export function HealthcareClaimsPolicyPackDetail(props: HealthcareClaimsPolicyPackDetailProps) {
  const { policyPackId, packRecord, packContent, isEnabled, isGloballyActive } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const packsHubHref = props.packsHubHref ?? GOVERNANCE_POLICY_PACKS_PATH;
  const findingsHref = props.findingsHref ?? "/governance/findings";

  const canonicalPackLabel = policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION);
  const provenanceLabel = resolvePackProvenanceLabel(packRecord);
  const rulesResolution = resolveHealthcareClaimsPolicyRuleRows(packContent, {
    hasPackRecord: packRecord !== null,
    packEnabled: isEnabled,
  });
  const ruleCount = rulesResolution.rows.length;
  const enforcementLabel = isEnabled ? "Enabled in workspace" : "Not enabled in workspace";
  const enforcementKind = isEnabled ? "ready" : "neutral";

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={packsHubHref}>Open policy pack library</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={findingsHref}>Open findings queue</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={GOVERNANCE_APPROVAL_QUEUE_PATH}>Open approval queue</Link>
      </Button>
      {buyerPolishedShell ? (
        <Button asChild variant="default" size="sm">
          <Link href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}>{BUYER_OPEN_SIGNED_RECORD_CTA}</Link>
        </Button>
      ) : null}
    </div>
  );

  return (
    <OperatorPageContainer
      variant={buyerPolishedShell ? "workflow" : "dashboard"}
      className={cn(OPERATOR_LAYOUT.sectionStack, "max-w-none")}
      data-testid="healthcare-claims-policy-pack-detail"
    >
      <OperatorPageHeader
        navHref={packsHubHref}
        title={canonicalPackLabel}
        headingLevel="h1"
        breadcrumb={<GovernancePolicyPackBreadcrumb packLabel="Enterprise Privacy" packsHubHref={packsHubHref} />}
        subtitle={buyerPolishedShell ? BUYER_POLICY_PACK_LEAD : HEALTHCARE_CLAIMS_WORKING_LEAD}
        claimDiscipline={POLICY_PACK_DETAIL_CLAIM_DISCIPLINE}
        claimDisciplineTestId="policy-pack-detail-claim-discipline"
        subtitleClassName="max-w-prose leading-relaxed"
        statusBadge={
          <div className="flex flex-wrap items-center gap-2" data-testid="healthcare-claims-pack-metadata">
            <StatusTag kind={enforcementKind} label={enforcementLabel} data-testid="policy-pack-workspace-enablement" />
            <StatusTag kind="neutral" label="Healthcare vertical" />
            <StatusTag kind="neutral" label="HIPAA-aligned intake posture" />
            <StatusTag
              kind="neutral"
              label={`v${CLAIMS_INTAKE_RULE_SET_VERSION} · effective 2026-05-01`}
              data-testid="policy-pack-provenance-tag"
            />
            {provenanceLabel.length > 0 ? <StatusTag kind="neutral" label={provenanceLabel} /> : null}
          </div>
        }
        actions={headerActions}
      />

      <Card data-testid="policy-pack-summary-card">
        <CardHeader>
          <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {isEnabled
              ? "This pack is enabled in the current workspace — findings may reference enforced rule families below."
              : "This pack is not enabled in the current workspace — rules below are published reference only until assignment."}
          </p>
        </CardHeader>
        <CardContent>
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Policy pack summary"
            data-testid="policy-pack-summary-row"
          >
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
              <dl className="m-0">
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Enabled in workspace</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {isEnabled ? "Enabled" : "Not enabled"}
                </dd>
              </dl>
            </div>
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
              <dl className="m-0">
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Assigned scopes</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {resolveAssignedScopesLabel(isEnabled, isGloballyActive)}
                </dd>
              </dl>
            </div>
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
              <dl className="m-0">
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Open findings</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  <Link className={OPERATOR_LINK.nav} href={findingsHref} data-testid="policy-pack-open-findings-link">
                    View queue
                  </Link>
                </dd>
              </dl>
            </div>
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
              <dl className="m-0">
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Rules</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {finiteIntegerCountDisplay(ruleCount)}
                </dd>
              </dl>
            </div>
          </section>
        </CardContent>
      </Card>

      <PolicyPackRulesTableSection
        headingId="healthcare-claims-policy-pack-rules-heading"
        heading={isEnabled ? "Enforced rules" : "Published rules"}
        intro={HEALTHCARE_CLAIMS_RULES_INTRO}
        rulesResolution={rulesResolution}
        ariaLabel="Healthcare claims policy pack rules"
        ruleAnchorPrefix="healthcare-claims-rule"
        tableTestId="healthcare-claims-policy-pack-rules-table"
      />

      <Card>
        <CardHeader>
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {buyerPolishedShell ? "What sponsors see first" : "Review focus"}
          </h2>
        </CardHeader>
        <CardContent>
          <ul className={cn("m-0 list-disc space-y-2 ps-5 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <li>Explicit minimization checks where identifiers cross trust boundaries.</li>
            <li>Required evidence artifacts for regulators — finalized review records, graph excerpts, and approval stay linked.</li>
            <li>Operational drift hooks when unstructured attachments spike risk.</li>
          </ul>
        </CardContent>
      </Card>

      <HealthcareClaimsPolicyPackTechnicalDetailsDisclosure policyPackId={policyPackId} />
    </OperatorPageContainer>
  );
}
