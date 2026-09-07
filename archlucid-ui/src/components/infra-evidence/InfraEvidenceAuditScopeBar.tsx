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
import type { CloudResourceAuditLineageMatch, ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
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
  readonly auditControlOptions?: readonly CloudResourceAuditLineageMatch[];
  readonly onAuditControlChange?: (match: CloudResourceAuditLineageMatch) => void;
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

function formatAuditControlOptionLabel(match: CloudResourceAuditLineageMatch): string {
  const labelParts = [match.controlNumber, match.controlTitle].filter((part) => part.trim().length > 0);

  if (labelParts.length > 0) {
    return labelParts.join(" · ");
  }

  return match.controlId;
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
    auditControlOptions = [],
    onAuditControlChange,
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
  const hasInlineControlPicker = auditControlOptions.length > 1 && onAuditControlChange != null;

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
      <div className="flex flex-wrap items-center gap-2">
        {hasInlineControlPicker ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Control</span>
            <select
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              data-testid={`${testId}-control-picker`}
              value={auditScope.controlId}
              onChange={(event) => {
                const nextMatch = auditControlOptions.find((match) => match.controlId === event.target.value);

                if (nextMatch != null) {
                  onAuditControlChange(nextMatch);
                }
              }}
            >
              {auditControlOptions.map((match) => (
                <option key={match.controlId} value={match.controlId}>
                  {formatAuditControlOptionLabel(match)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Button asChild variant="outline" size="sm" data-testid={`${testId}-change-control`}>
            <Link href={auditTabHref}>Change control</Link>
          </Button>
        )}
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
