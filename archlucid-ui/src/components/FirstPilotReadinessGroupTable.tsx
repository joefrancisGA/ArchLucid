import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import type { FirstPilotReadinessGroup, FirstPilotReadinessRow } from "@/lib/first-pilot-readiness-cockpit";
import {
  mapReadinessStatusToEnterpriseKind,
  mapReadinessStatusToStatusTagLabel,
} from "@/lib/first-pilot-operator-status-vocabulary";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type FirstPilotReadinessGroupTableProps = {
  readonly groupLabel: string;
  readonly group: FirstPilotReadinessGroup;
  readonly rows: readonly FirstPilotReadinessRow[];
};

/** Enterprise table layout for one readiness group (TB-121c). */
export function FirstPilotReadinessGroupTable(props: FirstPilotReadinessGroupTableProps): React.JSX.Element | null {
  const groupRows = props.rows.filter((row) => row.group === props.group);

  if (groupRows.length === 0) {
    return null;
  }

  const headingId = `readiness-group-${props.group}`;

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className={`mb-2 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
        {props.groupLabel}
      </h3>
      <EnterpriseTable ariaLabel={`${props.groupLabel} readiness`}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Area</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {groupRows.map((row) => (
            <EnterpriseTableRow key={row.id}>
              <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.cardTitle}>{row.label}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={mapReadinessStatusToEnterpriseKind(row.status)}
                  label={mapReadinessStatusToStatusTagLabel(row.status)}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>{row.summary}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <Button variant="link" size="sm" className="h-auto px-0" asChild>
                  <Link href={row.href}>{row.cta}</Link>
                </Button>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
