import { cn } from "@/lib/utils";
import Link from "next/link";

import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BUYER_GOVERNANCE_PAGE_TITLE, BUYER_OPEN_SIGNED_RECORD_CTA, BUYER_POLICY_PACK_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import { PolicyPackDetailBuyerChrome } from "./PolicyPackDetailBuyerChrome";

type HealthcareClaimsPolicyPackDetailProps = {
  readonly policyPackId: string;
};

/**
 * Sponsor-grade Healthcare Claims pack narrative aligned with the Claims Intake modernization sample review.
 */
export function HealthcareClaimsPolicyPackDetail(props: HealthcareClaimsPolicyPackDetailProps) {
  const { policyPackId } = props;

  const canonicalPackLabel = policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION);
  const versionBadgeLabel = `Healthcare Claims policy pack · v${CLAIMS_INTAKE_RULE_SET_VERSION} · effective 2026-05-01`;

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="healthcare-claims-policy-pack-detail">
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={canonicalPackLabel}
        headingLevel="h1"
        breadcrumb={<GovernancePolicyPackBreadcrumb packLabel="Enterprise Privacy" />}
        subtitle={BUYER_POLICY_PACK_LEAD}
        claimDiscipline={POLICY_PACK_DETAIL_CLAIM_DISCIPLINE}
        claimDisciplineTestId="policy-pack-detail-claim-discipline"
        subtitleClassName="max-w-prose leading-relaxed"
        actions={
          <Button asChild variant="default" size="sm">
            <Link href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}>{BUYER_OPEN_SIGNED_RECORD_CTA}</Link>
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Healthcare vertical</Badge>
          <Badge variant="outline">HIPAA-aligned intake posture</Badge>
          <Badge variant="outline">{versionBadgeLabel}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            Pack reference: {policyPackId}
          </p>
          <CopyIdButton value={policyPackId} aria-label="Copy policy pack ID" />
        </div>
      </OperatorPageHeader>

      <PolicyPackDetailBuyerChrome />

      <Card>
        <CardHeader>
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>What sponsors see first</h2>
        </CardHeader>
        <CardContent>
          <ul className={cn("m-0 list-disc space-y-2 ps-5 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <li>Explicit minimization checks where identifiers cross trust boundaries.</li>
            <li>Required evidence artifacts for regulators — finalized review records, graph excerpts, and approval stay linked.</li>
            <li>Operational drift hooks when unstructured attachments spike risk.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Rule families inside this pack</h2>
        </CardHeader>
        <CardContent>
          <dl className={cn("m-0 grid gap-4 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Identity &amp; lineage</dt>
              <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Tie findings to review record versions and approval so remediation retains provenance.
              </dd>
            </div>
            <div>
              <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Data minimization</dt>
              <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Prompts reviewers when PHI-bearing fields persist beyond necessary retention windows on intake APIs.
              </dd>
            </div>
            <div>
              <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Operational readiness</dt>
              <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Aligns monitoring hooks with drift alerts visible on the findings queue.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <nav className="flex flex-wrap gap-3" aria-label="Healthcare policy pack actions">
        <Button asChild variant="outline">
          <Link href={GOVERNANCE_POLICY_PACKS_PATH}>Open policy pack library</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/governance/approval-queue">{BUYER_GOVERNANCE_PAGE_TITLE}</Link>
        </Button>
      </nav>

      <Collapsible>
        <CollapsibleTrigger className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)}>
          Technical identifiers &amp; lifecycle metadata
        </CollapsibleTrigger>
        <CollapsibleContent className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <p className="m-0">
            Rule-set id <span className="font-mono">healthcare-claims-v3</span> · Effective version{" "}
            <span className="font-mono">{CLAIMS_INTAKE_RULE_SET_VERSION}</span>
          </p>
          <p className="m-0">
            Approval recorded against the finalized Claims Intake architecture package — cross-check the
            Approval tab for promotion readiness.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </OperatorPageContainer>
  );
}
