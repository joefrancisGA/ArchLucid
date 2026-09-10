"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useAdminPrerequisitesReadiness } from "@/hooks/use-admin-prerequisites-readiness";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AdminPrerequisiteRow } from "@/lib/resolve-admin-prerequisites-readiness";
import { isMandatoryForTenantReadiness } from "@/lib/resolve-admin-prerequisites-readiness";
import {
  mapReadinessStatusToEnterpriseKind,
  mapReadinessStatusToStatusTagLabel,
} from "@/lib/vocabulary/first-pilot-operator-status-vocabulary";
import { cn } from "@/lib/utils";

type AdminPrerequisitesReadinessBoardProps = {
  readonly enabled: boolean;
};

function prerequisiteStatusTag(row: AdminPrerequisiteRow, optional: boolean): { kind: ReturnType<typeof mapReadinessStatusToEnterpriseKind>; label: string } {
  if (optional) {
    if (row.status === "ready") {
      return { kind: "neutral", label: "Configured" };
    }

    if (row.status === "unknown") {
      return { kind: "neutral", label: mapReadinessStatusToStatusTagLabel(row.status) };
    }

    return { kind: "neutral", label: "Not configured" };
  }

  return {
    kind: mapReadinessStatusToEnterpriseKind(row.status),
    label: mapReadinessStatusToStatusTagLabel(row.status),
  };
}

function PrerequisiteRowTable(props: { readonly rows: readonly AdminPrerequisiteRow[]; readonly optional: boolean }) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <EnterpriseTable ariaLabel={props.optional ? "Optional setup items" : "Admin setup prerequisites"}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Item</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((row) => {
          const statusTag = prerequisiteStatusTag(row, props.optional);

          return (
            <EnterpriseTableRow key={row.id} data-testid={`admin-prerequisite-row-${row.id}`}>
              <EnterpriseTableCell className={DESIGN_TOKENS.table.rowLabel}>{row.label}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={statusTag.kind} label={statusTag.label} />
              </EnterpriseTableCell>
              <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                <InlineGuidanceText text={row.summary} />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link href={row.href}>{row.cta}</Link>
                </Button>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

/** Lists unmet tenant-admin prerequisites in dependency order (TB-2156). */
export function AdminPrerequisitesReadinessBoard(props: AdminPrerequisitesReadinessBoardProps): React.JSX.Element | null {
  const readiness = useAdminPrerequisitesReadiness(props.enabled);

  const { mandatoryRows, optionalRows } = useMemo(() => {
    const mandatory: AdminPrerequisiteRow[] = [];
    const optional: AdminPrerequisiteRow[] = [];

    for (const row of readiness.rows) {
      if (isMandatoryForTenantReadiness(row)) {
        mandatory.push(row);
      } else {
        optional.push(row);
      }
    }

    return { mandatoryRows: mandatory, optionalRows: optional };
  }, [readiness.rows]);

  if (!props.enabled) {
    return null;
  }

  if (readiness.phase === "loading") {
    return (
      <Card data-testid="admin-prerequisites-readiness-board">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <p className="m-0">Checking setup prerequisites…</p>
        </CardContent>
      </Card>
    );
  }

  if (readiness.allReady) {
    return (
      <Card data-testid="admin-prerequisites-readiness-board">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusTag kind="ready" label="Ready to run reviews" />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Required workspace setup is complete. Optional integrations and cloud evidence remain available when you need them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-prerequisites-readiness-board">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Prerequisites</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mandatoryRows.length > 0 ? (
          <div className="space-y-3">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Complete these items before your first production review. Each row links to the existing setup surface.
            </p>
            <PrerequisiteRowTable rows={mandatoryRows} optional={false} />
          </div>
        ) : null}

        {optionalRows.length > 0 ? (
          <div className="space-y-3" data-testid="admin-prerequisites-optional-group">
            <div>
              <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Optional, when you need it</h3>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                These items improve evidence coverage but do not block your first review.
              </p>
            </div>
            <PrerequisiteRowTable rows={optionalRows} optional />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
