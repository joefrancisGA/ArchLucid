"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  buildPolicyPacksHrefWithReviewId,
  POLICY_PACKS_REVIEW_ID_QUERY_PARAM,
} from "@/lib/policy-packs-review-handoff";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  policyPacksEditHref,
  reviewsNewWithPackHref,
} from "@/lib/policy/policy-packs-deep-link";
import { resolvePolicyPackDetailBreadcrumbLabel } from "@/lib/policy/policy-pack-detail-resolver";
import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import { POLICY_PACK_DETAIL_KEYBOARD_AFFORDANCE } from "@/lib/policy/policy-pack-detail-page-copy";
import { resolveResponsibleAiPolicyRuleRows } from "@/lib/policy/responsible-ai-policy-pack-rules";
import type { PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";

import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { PolicyPackGenericTechnicalDetailsDisclosure } from "./PolicyPackGenericTechnicalDetailsDisclosure";
import { PolicyPackRulesTableSection } from "./PolicyPackRulesTableSection";
import {
  RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE,
  RESPONSIBLE_AI_ACTION_GOVERNANCE,
  RESPONSIBLE_AI_ACTION_MANAGE_WORKSPACE_ASSIGNMENT,
  RESPONSIBLE_AI_ACTION_START_REVIEW,
} from "@/lib/responsible-ai-policy-pack-detail-content";

const GENERIC_RULES_INTRO =
  "Published rules for this pack are listed from pack content only — no platform template is substituted.";

type PolicyPackGenericDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack;
  readonly packContent: PolicyPackContentDocument | null;
  readonly isEnabled: boolean;
  readonly isGloballyActive: boolean;
  readonly scopedReviewId?: string;
  readonly packsHubHref?: string;
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
  const { productLine } = useProductLine();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const scopedReviewId = (props.scopedReviewId ?? "").trim();
  const packsHubHref = props.packsHubHref ?? GOVERNANCE_POLICY_PACKS_PATH;
  const policyPacksHubHref =
    scopedReviewId.length > 0 ? buildPolicyPacksHrefWithReviewId(scopedReviewId, packsHubHref) : packsHubHref;
  const policyPacksEditTargetHref =
    scopedReviewId.length > 0
      ? `${policyPacksEditHref(policyPackId, packsHubHref)}&${POLICY_PACKS_REVIEW_ID_QUERY_PARAM}=${encodeURIComponent(scopedReviewId)}`
      : policyPacksEditHref(policyPackId, packsHubHref);
  const packName = packRecord.name.trim().length > 0 ? packRecord.name.trim() : "Policy pack";
  const description =
    packRecord.description.trim().length > 0
      ? packRecord.description.trim()
      : "Review published versions, inspect how rules apply to this scope, and continue approval workflow steps from the policy pack library.";
  const rulesResolution = resolveResponsibleAiPolicyRuleRows(packContent, {
    hasPackRecord: true,
    usePlatformTemplateFallback: false,
  });
  const primaryActionLabel = isEnabled
    ? RESPONSIBLE_AI_ACTION_MANAGE_WORKSPACE_ASSIGNMENT
    : RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE;
  const showCrossProductActions = productLine !== "security";
  const activatedLabel = formatPackDate(packRecord.activatedUtc);
  const createdLabel = formatPackDate(packRecord.createdUtc);

  return (
    <OperatorPageContainer variant={buyerPolishedShell ? "workflow" : "dashboard"} className={OPERATOR_LAYOUT.sectionStack} data-testid="policy-pack-generic-detail">
      <OperatorPageHeader
        navHref={policyPacksHubHref}
        title={packName}
        subtitle={description}
        claimDiscipline={POLICY_PACK_DETAIL_CLAIM_DISCIPLINE}
        claimDisciplineTestId="policy-pack-detail-claim-discipline"
        titleTestId="policy-pack-detail-title"
        breadcrumb={
          <GovernancePolicyPackBreadcrumb
            packLabel={resolvePolicyPackDetailBreadcrumbLabel(policyPackId, packRecord)}
            packsHubHref={packsHubHref}
          />
        }
        statusBadge={resolveEnablementStatusTag(isEnabled, isGloballyActive)}
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="default" size="sm" data-testid="policy-pack-primary-action">
                <Link href={policyPacksEditTargetHref}>{primaryActionLabel}</Link>
              </Button>
              <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
              data-testid="policy-pack-detail-keyboard-affordance"
            >
              <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search.
              <span className="sr-only">{POLICY_PACK_DETAIL_KEYBOARD_AFFORDANCE}</span>
            </p>
          </div>
        }
      />

      <Card>
        <CardContent className={cn("space-y-2 p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineMetadataLine label="Activated" value={activatedLabel} />
          <InlineMetadataLine label="Created" value={createdLabel} />
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

      {showCrossProductActions ? (
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Policy pack actions">
          <Link className={OPERATOR_LINK.inline} href={reviewsNewWithPackHref(policyPackId)}>
            {RESPONSIBLE_AI_ACTION_START_REVIEW}
          </Link>
          <Link className={OPERATOR_LINK.inline} href="/governance/approval-queue">
            {RESPONSIBLE_AI_ACTION_GOVERNANCE}
          </Link>
        </nav>
      ) : null}

      <PolicyPackGenericTechnicalDetailsDisclosure policyPackId={policyPackId} />
    </OperatorPageContainer>
  );
}
