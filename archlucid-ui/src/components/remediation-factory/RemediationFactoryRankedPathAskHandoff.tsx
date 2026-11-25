"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildInfrastructureAskHref } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_DISABLED_LINE, REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_LABEL } from "@/lib/remediation-factory/remediation-factory-ranked-path-ask-handoff-copy";
import { INFRASTRUCTURE_ASK_RANKED_PATH_SCOPE_LINE } from "@/lib/infra-evidence/infrastructure-ask-ranked-path-honesty-copy";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { cn } from "@/lib/utils";

export function RemediationFactoryRankedPathAskHandoff(props: { readonly testId: string; readonly snapshotId: string | null; readonly securityEvidencePathId: string | null; readonly disabled?: boolean; readonly hubTab?: ResourceHubTab; readonly scopeLine?: string; readonly linkLabel?: string; }): React.JSX.Element {
  const pathId = props.securityEvidencePathId?.trim() ?? "";
  const snapshotId = props.snapshotId?.trim() ?? "";
  const enabled = !props.disabled && pathId.length > 0 && snapshotId.length > 0;
  const hubTab = props.hubTab ?? "remediation";
  const scopeLine = props.scopeLine ?? INFRASTRUCTURE_ASK_RANKED_PATH_SCOPE_LINE;
  const linkLabel = props.linkLabel ?? REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_LABEL;
  const href = enabled ? buildInfrastructureAskHref({ snapshotId, securityEvidencePathId: pathId, hubTab }) : "#";
  return (
    <div className={cn("space-y-1", OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId}>
      <p className="m-0" data-testid={`${props.testId}-discipline`}>{scopeLine}</p>
      {enabled ? (
        <Button asChild variant="outline" size="sm" data-testid={`${props.testId}-link`}>
          <Link className={OPERATOR_LINK.inline} href={href}>{linkLabel}</Link>
        </Button>
      ) : (
        <p className="m-0 text-al-text-secondary" data-testid={`${props.testId}-disabled`}>{REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_DISABLED_LINE}</p>
      )}
    </div>
  );
}
