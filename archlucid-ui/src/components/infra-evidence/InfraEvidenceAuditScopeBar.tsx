"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import { buildAuditEvidenceLineageUiPath } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  buildInfraEvidenceAuditScopeBarAuditTabHref,
  buildInfraEvidenceClearAuditScopeHref,
} from "@/lib/infra-evidence/infra-evidence-audit-scope-url";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraEvidenceAuditScopeBarProps = {
  readonly cloudResourceId: string;
  readonly auditScope: InfraEvidenceWorkbenchAuditScope;
  readonly currentSearch: string;
  readonly activeTab?: ResourceHubTab;
  readonly snapshotId?: string | null;
  readonly runId?: string | null;
  readonly controlNumber?: string | null;
  readonly controlTitle?: string | null;
  readonly testId?: string;
  readonly showCopyLink?: boolean;
};

function formatAuditControlLabel(
  auditScope: InfraEvidenceWorkbenchAuditScope,
  controlNumber?: string | null,
  controlTitle?: string | null,
): string {
  const labelParts = [controlNumber, controlTitle].filter((part) => part != null && part.trim().length > 0);

  if (labelParts.length > 0) {
    return labelParts.join(" · ");
  }

  return auditScope.controlId;
}

export function InfraEvidenceAuditScopeBar(props: InfraEvidenceAuditScopeBarProps): React.JSX.Element {
  const {
    cloudResourceId,
    auditScope,
    currentSearch,
    activeTab,
    snapshotId,
    runId,
    controlNumber,
    controlTitle,
    testId = "infra-evidence-audit-scope-bar",
    showCopyLink = true,
  } = props;
  const router = useRouter();
  const controlLabel = formatAuditControlLabel(auditScope, controlNumber, controlTitle);
  const auditTabHref = buildInfraEvidenceAuditScopeBarAuditTabHref(
    cloudResourceId,
    auditScope,
    snapshotId,
    runId,
  );
  const clearScopeHref = buildInfraEvidenceClearAuditScopeHref(cloudResourceId, currentSearch, activeTab);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-muted/20 p-3"
      data-testid={testId}
      role="region"
      aria-label="Active audit scope"
    >
      <p className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
        Audit scope:{" "}
        <Link
          className="text-al-link hover:underline"
          href={buildAuditEvidenceLineageUiPath(
            auditScope.assessmentId,
            auditScope.auditEvidenceSnapshotId,
            auditScope.controlId,
          )}
          data-testid={`${testId}-lineage-link`}
        >
          {controlLabel}
        </Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" data-testid={`${testId}-change-control`}>
          <Link href={auditTabHref}>Change control</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={`${testId}-clear-scope`}
          onClick={() => router.replace(clearScopeHref)}
        >
          Clear audit scope
        </Button>
        {showCopyLink ? (
          <CopyScopedOperatorLinkButton
            label="Copy scoped link"
            testId={`${testId}-copy-link`}
          />
        ) : null}
      </div>
    </div>
  );
}
