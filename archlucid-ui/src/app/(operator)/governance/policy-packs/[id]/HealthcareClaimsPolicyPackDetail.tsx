import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BUYER_GOVERNANCE_PAGE_TITLE, BUYER_OPEN_SIGNED_RECORD_CTA, BUYER_POLICY_PACK_LEAD } from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

type HealthcareClaimsPolicyPackDetailProps = {
  readonly policyPackId: string;
};

/**
 * Sponsor-grade Healthcare Claims pack narrative aligned with the Claims Intake modernization sample review.
 */
export function HealthcareClaimsPolicyPackDetail(props: HealthcareClaimsPolicyPackDetailProps) {
  const { policyPackId } = props;

  const canonicalPackLabel = policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const versionBadgeLabel = buyerPolishedShell
    ? `Healthcare Claims policy pack · v${CLAIMS_INTAKE_RULE_SET_VERSION} · effective 2026-05-01`
    : `Demonstration rule-set v${CLAIMS_INTAKE_RULE_SET_VERSION}`;

  return (
    <div className={cn("w-full max-w-[1200px] p-6", OPERATOR_LAYOUT.sectionStack)}>
      <OperatorPageHeader
        title={canonicalPackLabel}
        headingLevel="h1"
        breadcrumb={
          <p className={cn("m-0 text-[var(--al-accent-link)]", OPERATOR_NAV_GROUP_LABEL)}>Active policy pack</p>
        }
        subtitle={
          buyerPolishedShell
            ? BUYER_POLICY_PACK_LEAD
            : `${BUYER_POLICY_PACK_LEAD} — matching the Claims Intake showcase review referenced from Governance and sealed review record surfaces.`
        }
        subtitleClassName="max-w-prose leading-relaxed"
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Healthcare vertical</Badge>
          <Badge variant="outline">HIPAA-aligned intake posture</Badge>
          <Badge variant="outline">{versionBadgeLabel}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            {buyerPolishedShell ? "Pack reference" : "Pack reference id"}: {policyPackId}
          </p>
          <CopyIdButton value={policyPackId} aria-label="Copy policy pack ID" />
        </div>
      </OperatorPageHeader>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>What sponsors see first</h2>
        <ul className={cn("m-0 mt-3 list-disc space-y-2 ps-5 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <li>Explicit minimization checks where identifiers cross trust boundaries (mirrors the PHI finding storyline).</li>
          <li>Required evidence artifacts for regulators — sealed review records, graph excerpts, and governance approvals stay linked.</li>
          <li>Operational drift hooks when unstructured attachments spike risk (Alerts ties back to the sample intake graph).</li>
        </ul>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Rule families inside this pack</h2>
        <dl className={cn("m-0 mt-4 grid gap-4 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Identity &amp; lineage</dt>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Tie findings to review record versions and governance approvals so remediation retains provenance.
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
              Aligns monitoring hooks with drift alerts — visible on the sample Alerts inbox deep-linked to the PHI finding.
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}>
            {buyerPolishedShell ? BUYER_OPEN_SIGNED_RECORD_CTA : "Open Claims Intake review record"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/governance/policy-packs">Compare against registry catalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/governance/approval-queue">{buyerPolishedShell ? BUYER_GOVERNANCE_PAGE_TITLE : "Continue governance workflow"}</Link>
        </Button>
      </section>

      <Collapsible>
        <CollapsibleTrigger className={OPERATOR_DISCLOSURE_TRIGGER_CLASS}>
          Technical identifiers &amp; lifecycle metadata
        </CollapsibleTrigger>
        <CollapsibleContent className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <p className="m-0">
            Rule-set id <span className="font-mono">healthcare-claims-v3</span> · Effective demonstration version{" "}
            <span className="font-mono">{CLAIMS_INTAKE_RULE_SET_VERSION}</span>
          </p>
          <p className="m-0">
            Governance approvals recorded against review record hash shown on the finalized Claims Intake package — cross-check the
            Governance tab for promotion readiness.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
