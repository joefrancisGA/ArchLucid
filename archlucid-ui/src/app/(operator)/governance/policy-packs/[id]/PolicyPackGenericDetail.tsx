import Link from "next/link";
import { cn } from "@/lib/utils";

import { CopyIdButton } from "@/components/CopyIdButton";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusTag } from "@/components/ui/status-tag";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  policyPacksEditHref,
  reviewsNewWithPackHref,
} from "@/lib/policy/policy-packs-deep-link";
import { resolvePolicyPackDetailBreadcrumbLabel } from "@/lib/policy/policy-pack-detail-resolver";
import { resolveResponsibleAiPolicyRuleRows } from "@/lib/policy/responsible-ai-policy-pack-rules";
import type { PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { PolicyPackDetailBuyerChrome } from "./PolicyPackDetailBuyerChrome";
import { PolicyPackRulesTableSection } from "./PolicyPackRulesTableSection";
import {
  RESPONSIBLE_AI_ACTION_GOVERNANCE,
  RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE,
  RESPONSIBLE_AI_ACTION_OPEN_LIBRARY,
  RESPONSIBLE_AI_ACTION_START_REVIEW,
  RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS,
} from "@/lib/responsible-ai-policy-pack-detail-content";

const GENERIC_RULES_INTRO =
  "Published rules for this pack are listed from pack content only — no platform template is substituted.";

type PolicyPackGenericDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack;
  readonly packContent: PolicyPackContentDocument | null;
  readonly isEnabled: boolean;
  readonly isGloballyActive: boolean;
};

function formatPackDate(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return " — ";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
}

function resolveEnablementStatusTag(isEnabled: boolean, isGloballyActive: boolean): React.JSX.Element {
  if (isEnabled) {
    return <StatusTag kind="ready" label="Enabled in workspace" data-testid="policy-pack-enablement-tag" />;
  }

  if (isGloballyActive) {
    return (
      <StatusTag
        kind="neutral"
        label="Available globally · not enabled in workspace"
        data-testid="policy-pack-enablement-tag"
      />
    );
  }

  return <StatusTag kind="neutral" label="Not in scope" data-testid="policy-pack-enablement-tag" />;
}

export function PolicyPackGenericDetail(props: PolicyPackGenericDetailProps): React.JSX.Element {
  const { policyPackId, packRecord, packContent, isEnabled, isGloballyActive } = props;
  const packName = packRecord.name.trim().length > 0 ? packRecord.name.trim() : "Policy pack";
  const description =
    packRecord.description.trim().length > 0
      ? packRecord.description.trim()
      : "Review published versions, inspect how rules apply to this scope, and continue approval workflow steps from the policy pack library.";
  const rulesResolution = resolveResponsibleAiPolicyRuleRows(packContent, {
    hasPackRecord: true,
    usePlatformTemplateFallback: false,
  });

  return (
    <div className={cn("w-full max-w-[1200px] p-4", OPERATOR_LAYOUT.sectionStack)} data-testid="policy-pack-generic-detail">
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={packName}
        subtitle={description}
        titleTestId="policy-pack-detail-title"
        breadcrumb={
          <GovernancePolicyPackBreadcrumb
            packLabel={resolvePolicyPackDetailBreadcrumbLabel(policyPackId, packRecord)}
          />
        }
        statusBadge={resolveEnablementStatusTag(isEnabled, isGloballyActive)}
        actions={
          <Button asChild variant="default" size="sm" data-testid="policy-pack-primary-action">
            <Link href={policyPacksEditHref(policyPackId)}>{RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE}</Link>
          </Button>
        }
      />

      <PolicyPackDetailBuyerChrome />

      <Card>
        <CardContent className={cn("space-y-2 pt-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineMetadataLine
            label="Last updated"
            value={formatPackDate(packRecord.activatedUtc ?? packRecord.createdUtc)}
          />
          <InlineMetadataLine label="Pack type" value={packRecord.packType || "Custom"} />
          <InlineMetadataLine label="Version" value={packRecord.currentVersion?.trim() || " — "} />
        </CardContent>
      </Card>

      <PolicyPackRulesTableSection
        headingId="policy-pack-generic-rules-heading"
        heading="Rules and controls"
        intro={GENERIC_RULES_INTRO}
        rulesResolution={rulesResolution}
        ariaLabel="Policy pack rules"
      />

      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Policy pack actions">
        <Link className={OPERATOR_LINK.inline} href={GOVERNANCE_POLICY_PACKS_PATH}>
          {RESPONSIBLE_AI_ACTION_OPEN_LIBRARY}
        </Link>
        <Link className={OPERATOR_LINK.inline} href={reviewsNewWithPackHref(policyPackId)}>
          {RESPONSIBLE_AI_ACTION_START_REVIEW}
        </Link>
        <Link className={OPERATOR_LINK.inline} href="/governance/approval-queue">
          {RESPONSIBLE_AI_ACTION_GOVERNANCE}
        </Link>
      </nav>

      <Collapsible>
        <CollapsibleTrigger className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)}>
          {RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            Pack reference: {policyPackId}
          </p>
          <CopyIdButton value={policyPackId} aria-label="Copy policy pack ID" />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
