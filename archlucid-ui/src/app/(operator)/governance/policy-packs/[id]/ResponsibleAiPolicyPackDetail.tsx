import Link from "next/link";
import { cn } from "@/lib/utils";

import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusTag } from "@/components/ui/status-tag";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  policyPacksEditHref,
  reviewsNewWithPackHref,
} from "@/lib/policy/policy-packs-deep-link";
import { resolveResponsibleAiPolicyRuleRows } from "@/lib/policy/responsible-ai-policy-pack-rules";
import {
  BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID,
  isBundledResponsibleAiPlatformPack,
} from "@/lib/policy/policy-pack-detail-resolver";
import {
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
  policyPackTypeDisplayLabel,
} from "@/lib/policy/policy-pack-type-label";
import type { PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

import {
  RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE,
  RESPONSIBLE_AI_ACTION_GOVERNANCE,
  RESPONSIBLE_AI_ACTION_OPEN_LIBRARY,
  RESPONSIBLE_AI_ACTION_START_REVIEW,
  RESPONSIBLE_AI_EVIDENCE_REQUIRED_ITEMS,
  RESPONSIBLE_AI_POLICY_PACK_APPLICABILITY,
  RESPONSIBLE_AI_POLICY_PACK_APPLIES_TO,
  RESPONSIBLE_AI_POLICY_PACK_BASELINE_VERSION,
  RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL,
  RESPONSIBLE_AI_POLICY_PACK_DESCRIPTION,
  RESPONSIBLE_AI_POLICY_PACK_GOVERNANCE_WORKFLOW,
  RESPONSIBLE_AI_POLICY_PACK_NOT_PUBLISHED_QUALIFIER,
  RESPONSIBLE_AI_POLICY_PACK_OVERVIEW,
  RESPONSIBLE_AI_POLICY_PACK_PAGE_TITLE,
  RESPONSIBLE_AI_POLICY_PACK_SUBTITLE,
  RESPONSIBLE_AI_RULES_TABLE_INTRO,
  RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE,
  RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS,
} from "@/lib/responsible-ai-policy-pack-detail-content";

import { PolicyPackRulesTableSection } from "./PolicyPackRulesTableSection";
import { PolicyPackDetailBuyerChrome } from "./PolicyPackDetailBuyerChrome";

type ResponsibleAiPolicyPackDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack | null;
  readonly packContent: PolicyPackContentDocument | null;
  readonly isEnabled: boolean;
  readonly isGloballyActive: boolean;
};

type SummaryMetricValue = {
  readonly value: string;
  readonly qualifier?: string;
};

function formatPackTimestamp(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
}

function resolveVersionMetric(packRecord: PolicyPack | null): SummaryMetricValue {
  const version = packRecord?.currentVersion?.trim() ?? "";

  if (version.length > 0) {
    return { value: version };
  }

  return { value: " — ", qualifier: RESPONSIBLE_AI_POLICY_PACK_NOT_PUBLISHED_QUALIFIER };
}

function resolveLastUpdatedMetric(packRecord: PolicyPack | null): SummaryMetricValue {
  const formatted =
    formatPackTimestamp(packRecord?.activatedUtc) ?? formatPackTimestamp(packRecord?.createdUtc);

  if (formatted !== null) {
    return { value: formatted };
  }

  return { value: "Unavailable", qualifier: RESPONSIBLE_AI_POLICY_PACK_NOT_PUBLISHED_QUALIFIER };
}

function resolveLifecycleStatusLabel(packRecord: PolicyPack | null): string {
  const status = packRecord?.status?.trim() ?? "";

  if (status.length === 0) {
    return "Unavailable";
  }

  const normalized = status.toLowerCase();

  if (normalized === "draft") {
    return "Draft";
  }

  if (normalized === "disabled" || normalized === "inactive") {
    return "Not enabled";
  }

  if (normalized === "active") {
    return "Active";
  }

  return status;
}

function resolveLifecycleStatusTagKind(packRecord: PolicyPack | null): "ready" | "neutral" | "needs-attention" {
  const label = resolveLifecycleStatusLabel(packRecord).toLowerCase();

  if (label === "active") {
    return "ready";
  }

  if (label === "draft") {
    return "needs-attention";
  }

  return "neutral";
}

function resolveAssignedScopesLabel(isEnabled: boolean, isGloballyActive: boolean): string {
  if (isEnabled) {
    return "Workspace";
  }

  if (isGloballyActive) {
    return "Available globally";
  }

  return "Not assigned";
}

function SummaryMetric(props: {
  readonly label: string;
  readonly value: string;
  readonly qualifier?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <dl className="m-0">
        <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</dt>
        <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.value}</dd>
        {props.qualifier !== undefined ? (
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.qualifier}</dd>
        ) : null}
      </dl>
    </div>
  );
}

function resolvePackProvenanceLabel(packRecord: PolicyPack | null, policyPackId: string): string | null {
  if (packRecord !== null) {
    const packType = packRecord.packType?.trim() ?? "";

    if (packType.length > 0) {
      return policyPackTypeDisplayLabel(packType);
    }
  }

  if (isBundledResponsibleAiPlatformPack(policyPackId, packRecord)) {
    return policyPackTypeDisplayLabel(POLICY_PACK_TYPE_PLATFORM_DEFAULT);
  }

  return null;
}

export function ResponsibleAiPolicyPackDetail(props: ResponsibleAiPolicyPackDetailProps): React.JSX.Element {
  const { policyPackId, packRecord, packContent, isEnabled, isGloballyActive } = props;
  const versionMetric = resolveVersionMetric(packRecord);
  const lastUpdatedMetric = resolveLastUpdatedMetric(packRecord);
  const rulesResolution = resolveResponsibleAiPolicyRuleRows(packContent, {
    hasPackRecord: packRecord !== null,
  });
  const ruleCount = rulesResolution.rows.length;
  const provenanceLabel = resolvePackProvenanceLabel(packRecord, policyPackId);
  const technicalVersion =
    packRecord?.currentVersion?.trim() || RESPONSIBLE_AI_POLICY_PACK_BASELINE_VERSION;
  const lifecycleStatusLabel = resolveLifecycleStatusLabel(packRecord);
  const headerActions = (
    <>
      <Button asChild variant="default" size="sm" data-testid="policy-pack-primary-action">
        <Link href={policyPacksEditHref(policyPackId)}>{RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE}</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={reviewsNewWithPackHref(policyPackId)}>{RESPONSIBLE_AI_ACTION_START_REVIEW}</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={GOVERNANCE_POLICY_PACKS_PATH}>{RESPONSIBLE_AI_ACTION_OPEN_LIBRARY}</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/governance/approval-queue">{RESPONSIBLE_AI_ACTION_GOVERNANCE}</Link>
      </Button>
    </>
  );

  return (
    <div className={cn("w-full max-w-[1200px] p-4", OPERATOR_LAYOUT.sectionStack)} data-testid="responsible-ai-policy-pack-detail">
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={RESPONSIBLE_AI_POLICY_PACK_PAGE_TITLE}
        subtitle={RESPONSIBLE_AI_POLICY_PACK_SUBTITLE}
        titleTestId="policy-pack-detail-title"
        breadcrumb={<GovernancePolicyPackBreadcrumb packLabel={RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL} />}
        statusBadge={
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag
              kind={resolveLifecycleStatusTagKind(packRecord)}
              label={lifecycleStatusLabel}
              data-testid="policy-pack-status-badge"
            />
            {provenanceLabel !== null ? (
              <StatusTag kind="neutral" label={provenanceLabel} data-testid="policy-pack-provenance-tag" />
            ) : null}
          </div>
        }
        actions={headerActions}
      />

      <PolicyPackDetailBuyerChrome />

      <Card data-testid="policy-pack-summary-card">
        <CardHeader>
          <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {RESPONSIBLE_AI_POLICY_PACK_DESCRIPTION}
          </p>
        </CardHeader>
        <CardContent>
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
            aria-label="Policy pack summary"
            data-testid="policy-pack-summary-row"
          >
            <SummaryMetric
              label="Enabled in workspace"
              value={isEnabled ? "Enabled" : "Not enabled"}
            />
            <SummaryMetric label="Assigned scopes" value={resolveAssignedScopesLabel(isEnabled, isGloballyActive)} />
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
              <dl className="m-0">
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Open findings</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  <Link className={OPERATOR_LINK.nav} href={GOVERNANCE_FINDINGS_PATH} data-testid="policy-pack-open-findings-link">
                    View queue
                  </Link>
                </dd>
              </dl>
            </div>
            <SummaryMetric label="Version" value={versionMetric.value} qualifier={versionMetric.qualifier} />
            <SummaryMetric label="Rules" value={finiteIntegerCountDisplay(ruleCount)} />
          </section>
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Last updated:{" "}
            <span className="font-medium text-al-text-primary">{lastUpdatedMetric.value}</span>
            {lastUpdatedMetric.qualifier !== undefined ? ` · ${lastUpdatedMetric.qualifier}` : null}
          </p>
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

      <PolicyPackRulesTableSection
        headingId="policy-pack-rules-heading"
        heading="Rules and controls"
        intro={RESPONSIBLE_AI_RULES_TABLE_INTRO}
        rulesResolution={rulesResolution}
        ariaLabel="Responsible AI policy rules"
      />

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
              <dd className="m-0 font-mono text-al-text-primary">{BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Curated rules artifact</dt>
              <dd className="m-0 font-mono text-al-text-primary">ai-governance-responsible-ai-rules-v1.json</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Version history</dt>
              <dd className="m-0 text-al-text-primary">{technicalVersion} · platform default baseline</dd>
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
