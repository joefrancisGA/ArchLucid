"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  formatInfraEvidenceChangeTypeLabel,
  resolveInfraEvidenceChangeTypeStatusKind,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import type {
  CloudResourceInventoryChangeSummary,
  ResourceHubTab,
} from "@/lib/infra-evidence/infra-evidence-hub-types";
import type { InfrastructureAskAuditContext } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export type ResourceHubDriftChangesTableProps = {
  readonly changes: readonly CloudResourceInventoryChangeSummary[];
  readonly cloudResourceId: string;
  readonly resolvedSnapshotId: string;
  readonly runId: string;
  readonly askAuditContext: InfrastructureAskAuditContext;
  readonly buildChangeWorkbenchHref: (
    change: CloudResourceInventoryChangeSummary,
  ) => string;
  readonly buildChangeAskHref: (change: CloudResourceInventoryChangeSummary) => string;
  readonly testIdPrefix: string;
  readonly showOldNew?: boolean;
  readonly showRisk?: boolean;
  readonly showChangeType?: boolean;
};

export function ResourceHubDriftChangesTable(props: ResourceHubDriftChangesTableProps): React.JSX.Element {
  const {
    changes,
    buildChangeWorkbenchHref,
    buildChangeAskHref,
    testIdPrefix,
    showOldNew = true,
    showRisk = true,
    showChangeType = true,
  } = props;

  return (
    <EnterpriseTable ariaLabel="Inventory drift changes for resource">
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>Property</EnterpriseTableHeaderCell>
          {showChangeType ? <EnterpriseTableHeaderCell>Change</EnterpriseTableHeaderCell> : null}
          {showRisk ? <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell> : null}
          {showOldNew ? <EnterpriseTableHeaderCell>Old</EnterpriseTableHeaderCell> : null}
          {showOldNew ? <EnterpriseTableHeaderCell>New</EnterpriseTableHeaderCell> : null}
          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {changes.map((change) => (
          <EnterpriseTableRow key={change.changeId}>
            <EnterpriseTableCell>
              <Link
                className="text-al-link hover:underline"
                href={buildChangeWorkbenchHref(change)}
                data-testid={`${testIdPrefix}-change-${change.changeId}`}
              >
                {change.property ?? change.changeType}
              </Link>
            </EnterpriseTableCell>
            {showChangeType ? (
              <EnterpriseTableCell>
                <StatusTag
                  kind={resolveInfraEvidenceChangeTypeStatusKind(change.changeType)}
                  label={formatInfraEvidenceChangeTypeLabel(change.changeType)}
                />
              </EnterpriseTableCell>
            ) : null}
            {showRisk ? (
              <EnterpriseTableCell>
                {change.riskClassification != null ? (
                  <SeverityTag severity={change.riskClassification} />
                ) : (
                  "—"
                )}
              </EnterpriseTableCell>
            ) : null}
            {showOldNew ? (
              <EnterpriseTableCell className="font-mono text-xs">{change.oldValue ?? "—"}</EnterpriseTableCell>
            ) : null}
            {showOldNew ? (
              <EnterpriseTableCell className="font-mono text-xs">{change.newValue ?? "—"}</EnterpriseTableCell>
            ) : null}
            <EnterpriseTableCell>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildChangeAskHref(change)}
                  data-testid={`${testIdPrefix}-ask-${change.changeId}`}
                >
                  Ask
                </Link>
              </Button>
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

export type ResourceHubDriftTabId = ResourceHubTab;
