import Link from "next/link";
import { cn } from "@/lib/utils";

import { CopyIdButton } from "@/components/CopyIdButton";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import type { PolicyPack } from "@/types/policy-packs";

import {
  RESPONSIBLE_AI_ACTION_APPLY_TO_REVIEW,
  RESPONSIBLE_AI_ACTION_GOVERNANCE,
  RESPONSIBLE_AI_ACTION_OPEN_LIBRARY,
  RESPONSIBLE_AI_ACTION_START_REVIEW,
  RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS,
} from "@/lib/responsible-ai-policy-pack-detail-content";

type PolicyPackGenericDetailProps = {
  readonly policyPackId: string;
  readonly packRecord: PolicyPack;
};

function formatPackDate(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return "—";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
}

export function PolicyPackGenericDetail(props: PolicyPackGenericDetailProps): React.JSX.Element {
  const { policyPackId, packRecord } = props;
  const packName = packRecord.name.trim().length > 0 ? packRecord.name.trim() : "Policy pack";
  const description =
    packRecord.description.trim().length > 0
      ? packRecord.description.trim()
      : "Review published versions, inspect how rules apply to this scope, and continue governance workflow steps from the policy pack library.";

  return (
    <div className={cn("w-full max-w-[1200px] p-4", OPERATOR_LAYOUT.sectionStack)} data-testid="policy-pack-generic-detail">
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={packName}
        subtitle={description}
        titleTestId="policy-pack-detail-title"
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{packName}</CardTitle>
          <Badge variant="secondary">{packRecord.status || "Active"}</Badge>
          <Badge variant="outline">v{packRecord.currentVersion || "—"}</Badge>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineMetadataLine
            label="Last updated"
            value={formatPackDate(packRecord.activatedUtc ?? packRecord.createdUtc)}
          />
          <InlineMetadataLine label="Pack type" value={packRecord.packType || "Custom"} />
        </CardContent>
      </Card>

      <section className="flex flex-wrap gap-3">
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
