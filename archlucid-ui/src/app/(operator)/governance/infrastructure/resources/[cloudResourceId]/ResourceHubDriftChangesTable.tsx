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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
          <EnterpriseTableHeaderCell>
            <span>Property</span>
            <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>The resource property associated with this change.</span>
          </EnterpriseTableHeaderCell>
          {showChangeType ? (
            <EnterpriseTableHeaderCell>
              <span>Change</span>
              <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>What changed between the selected snapshots.</span>
            </EnterpriseTableHeaderCell>
          ) : null}
          {showRisk ? (
            <EnterpriseTableHeaderCell>
              <span>Risk</span>
              <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>The impact classification assigned to this change.</span>
            </EnterpriseTableHeaderCell>
          ) : null}
          {showOldNew ? (
            <EnterpriseTableHeaderCell>
              <span>Old</span>
              <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>
                The value in the baseline snapshot.
              </span>
            </EnterpriseTableHeaderCell>
          ) : null}
          {showOldNew ? (
            <EnterpriseTableHeaderCell>
              <span>New</span>
              <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>
                The value in the later snapshot.
              </span>
            </EnterpriseTableHeaderCell>
          ) : null}
          <EnterpriseTableHeaderCell>
            <span>Actions</span>
            <span className={`ml-2 font-normal ${OPERATOR_TYPOGRAPHY.helper}`}>Open the change in drift review or ask about its evidence.</span>
          </EnterpriseTableHeaderCell>
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
