import Link from "next/link";
import { cn } from "@/lib/utils";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import type { PolicyPack } from "@/types/policy-packs";

import {
  RESPONSIBLE_AI_ACTION_APPLY_TO_REVIEW,
  RESPONSIBLE_AI_ACTION_GOVERNANCE,
  RESPONSIBLE_AI_ACTION_OPEN_LIBRARY,
  RESPONSIBLE_AI_ACTION_START_REVIEW,
  RESPONSIBLE_AI_EVIDENCE_REQUIRED_ITEMS,
  RESPONSIBLE_AI_POLICY_PACK_APPLICABILITY,
  RESPONSIBLE_AI_POLICY_PACK_APPLIES_TO,
  RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION,
  RESPONSIBLE_AI_POLICY_PACK_DESCRIPTION,
  RESPONSIBLE_AI_POLICY_PACK_DISPLAY_NAME,
  RESPONSIBLE_AI_POLICY_PACK_GOVERNANCE_WORKFLOW,
  RESPONSIBLE_AI_POLICY_PACK_LAST_UPDATED_LABEL,
  RESPONSIBLE_AI_POLICY_PACK_OVERVIEW,
  RESPONSIBLE_AI_POLICY_PACK_PAGE_TITLE,
  RESPONSIBLE_AI_POLICY_PACK_SUBTITLE,
  RESPONSIBLE_AI_POLICY_RULE_ROWS,
  RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE,
  RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS,
} from "@/lib/responsible-ai-policy-pack-detail-content";

type ResponsibleAiPolicyPackDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack | null;
  readonly isSample: boolean;
};

function formatLastUpdated(packRecord: PolicyPack | null): string {
  const activated = packRecord?.activatedUtc?.trim() ?? "";
  const created = packRecord?.createdUtc?.trim() ?? "";

  if (activated.length > 0) {
    const ms = Date.parse(activated);

    if (!Number.isNaN(ms)) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
    }
  }

  if (created.length > 0) {
    const ms = Date.parse(created);

    if (!Number.isNaN(ms)) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
    }
  }

  return RESPONSIBLE_AI_POLICY_PACK_LAST_UPDATED_LABEL;
}

function resolveStatusLabel(packRecord: PolicyPack | null, isSample: boolean): string {
  if (isSample) {
    return "Sample";
  }

  const status = packRecord?.status?.trim() ?? "";

  if (status.length === 0) {
    return "Active";
  }

  if (status.toLowerCase() === "draft") {
    return "Draft";
  }

  if (status.toLowerCase() === "disabled" || status.toLowerCase() === "inactive") {
    return "Not enabled";
  }

  return "Active";
}

function SummaryMetric(props: { readonly label: string; readonly value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.value}</p>
    </div>
  );
}

export function ResponsibleAiPolicyPackDetail(props: ResponsibleAiPolicyPackDetailProps): React.JSX.Element {
  const { policyPackId, packRecord, isSample } = props;
  const version = packRecord?.currentVersion?.trim() || RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION;
  const statusLabel = resolveStatusLabel(packRecord, isSample);
  const ruleCount = RESPONSIBLE_AI_POLICY_RULE_ROWS.length;

  return (
    <div className={cn("w-full max-w-[1200px] p-4", OPERATOR_LAYOUT.sectionStack)} data-testid="responsible-ai-policy-pack-detail">
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={RESPONSIBLE_AI_POLICY_PACK_PAGE_TITLE}
        subtitle={RESPONSIBLE_AI_POLICY_PACK_SUBTITLE}
        titleTestId="policy-pack-detail-title"
      />

      <Card data-testid="policy-pack-summary-card">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{RESPONSIBLE_AI_POLICY_PACK_DISPLAY_NAME}</CardTitle>
            <Badge variant={isSample ? "outline" : "secondary"} data-testid="policy-pack-status-badge">
              {statusLabel}
            </Badge>
            {isSample ? (
              <Badge variant="outline" data-testid="policy-pack-sample-badge">
                Sample policy pack
              </Badge>
            ) : null}
          </div>
          <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{RESPONSIBLE_AI_POLICY_PACK_DESCRIPTION}</p>
        </CardHeader>
        <CardContent>
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
            aria-label="Policy pack summary"
            data-testid="policy-pack-summary-row"
          >
            <SummaryMetric label="Policy pack name" value={RESPONSIBLE_AI_POLICY_PACK_DISPLAY_NAME} />
            <SummaryMetric label="Status" value={statusLabel} />
            <SummaryMetric label="Version" value={version} />
            <SummaryMetric label="Last updated" value={formatLastUpdated(packRecord)} />
            <SummaryMetric label="Rules" value={finiteIntegerCountDisplay(ruleCount)} />
          </section>
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Applies to: <span className="font-medium text-al-text-primary">{RESPONSIBLE_AI_POLICY_PACK_APPLIES_TO}</span>
          </p>
        </CardContent>
      </Card>

      <section className="space-y-2" aria-labelledby="policy-pack-overview-heading">
        <h3 id="policy-pack-overview-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Overview
        </h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{RESPONSIBLE_AI_POLICY_PACK_OVERVIEW}</p>
      </section>

      <section className="space-y-3" aria-labelledby="policy-pack-rules-heading">
        <h3 id="policy-pack-rules-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Rules and controls
        </h3>
        <EnterpriseTable ariaLabel="Responsible AI policy rules" data-testid="policy-pack-rules-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Rule name</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Requirement</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Evidence expected</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {RESPONSIBLE_AI_POLICY_RULE_ROWS.map((row) => (
              <EnterpriseTableRow key={row.ruleName}>
                <EnterpriseTableCell>{row.ruleName}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.severity}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.requirement}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.evidenceExpected}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.status}</EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </section>

      <section className="space-y-2" aria-labelledby="policy-pack-evidence-heading">
        <h3 id="policy-pack-evidence-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Evidence required
        </h3>
        <ul className={cn("m-0 list-disc space-y-1 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="policy-pack-evidence-list">
          {RESPONSIBLE_AI_EVIDENCE_REQUIRED_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2" aria-labelledby="policy-pack-applicability-heading">
        <h3 id="policy-pack-applicability-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Applicability
        </h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{RESPONSIBLE_AI_POLICY_PACK_APPLICABILITY}</p>
      </section>

      <section className="space-y-2" aria-labelledby="policy-pack-governance-heading">
        <h3 id="policy-pack-governance-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Governance workflow
        </h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{RESPONSIBLE_AI_POLICY_PACK_GOVERNANCE_WORKFLOW}</p>
      </section>

      <section className="flex flex-wrap gap-3" data-testid="policy-pack-detail-actions">
        <Button asChild variant="default" size="sm">
          <Link href={policyPacksEditHref(policyPackId)}>{RESPONSIBLE_AI_ACTION_APPLY_TO_REVIEW}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={GOVERNANCE_POLICY_PACKS_PATH}>{RESPONSIBLE_AI_ACTION_OPEN_LIBRARY}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/architecture/reviews/new">{RESPONSIBLE_AI_ACTION_START_REVIEW}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/governance/approval-queue">{RESPONSIBLE_AI_ACTION_GOVERNANCE}</Link>
        </Button>
      </section>

      <Collapsible>
        <CollapsibleTrigger className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)} data-testid="policy-pack-technical-details-trigger">
          {RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
          <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE}</h4>
          <dl className={cn("m-0 mt-3 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
            <div>
              <dt className="text-al-text-secondary">Pack reference</dt>
              <dd className="m-0 flex flex-wrap items-center gap-2 font-mono text-al-text-primary">{policyPackId}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Template id</dt>
              <dd className="m-0 font-mono text-al-text-primary">ai-governance-responsible-ai-v1</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Curated rules artifact</dt>
              <dd className="m-0 font-mono text-al-text-primary">ai-governance-responsible-ai-rules-v1.json</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Version history</dt>
              <dd className="m-0 text-al-text-primary">{version} · platform default baseline</dd>
            </div>
          </dl>
          <div className="mt-3">
            <CopyIdButton value={policyPackId} aria-label="Copy policy pack ID" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
