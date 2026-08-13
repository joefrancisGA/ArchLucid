"use client";

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
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useAdminPrerequisitesReadiness } from "@/hooks/use-admin-prerequisites-readiness";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  mapReadinessStatusToEnterpriseKind,
  mapReadinessStatusToStatusTagLabel,
} from "@/lib/vocabulary/first-pilot-operator-status-vocabulary";
import { cn } from "@/lib/utils";

type AdminPrerequisitesReadinessBoardProps = {
  readonly enabled: boolean;
};

/** Lists unmet tenant-admin prerequisites in dependency order (TB-2156). */
export function AdminPrerequisitesReadinessBoard(props: AdminPrerequisitesReadinessBoardProps): React.JSX.Element | null {
  const readiness = useAdminPrerequisitesReadiness(props.enabled);

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
      <CardContent className="space-y-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Complete these items before your first production review. Each row links to the existing setup surface.
        </p>
        <EnterpriseTable ariaLabel="Admin setup prerequisites">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Item</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {readiness.rows.map((row) => (
              <EnterpriseTableRow key={row.id} data-testid={`admin-prerequisite-row-${row.id}`}>
                <EnterpriseTableCell className={DESIGN_TOKENS.table.rowLabel}>{row.label}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={mapReadinessStatusToEnterpriseKind(row.status)}
                    label={mapReadinessStatusToStatusTagLabel(row.status)}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                  <InlineGuidanceText text={row.summary} />
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <Button variant="outline" size="sm" className={cn("h-7 px-0", OPERATOR_TYPOGRAPHY.helper)} asChild>
                    <Link href={row.href}>{row.cta}</Link>
                  </Button>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </CardContent>
    </Card>
  );
}
