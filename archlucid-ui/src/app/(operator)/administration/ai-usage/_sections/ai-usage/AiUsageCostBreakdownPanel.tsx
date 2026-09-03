"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { aiUsageGroupByHrefFromSearch } from "@/lib/administration/ai-usage-dashboard-filter-url";
import type { AiUsageBreakdownRow } from "@/lib/ai-usage-dashboard-model";
import type { AiUsageBreakdownGroupBy } from "@/lib/ai-usage-dashboard-filters";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import Link from "next/link";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly rows: readonly AiUsageBreakdownRow[];
  readonly currency: string;
  readonly groupBy: AiUsageBreakdownGroupBy;
  readonly currentSearch: string;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly onGroupByChange: (groupBy: AiUsageBreakdownGroupBy) => void;
};

const GROUP_OPTIONS: readonly { readonly id: AiUsageBreakdownGroupBy; readonly label: string }[] = [
  { id: "project", label: "Project" },
  { id: "workspace", label: "Workspace" },
  { id: "operation", label: "Operation type" },
  { id: "model", label: "Model" },
  { id: "user", label: "User" },
  { id: "run", label: "Review run" },
];

function groupByLabel(groupBy: AiUsageBreakdownGroupBy): string {
  return GROUP_OPTIONS.find((option) => option.id === groupBy)?.label ?? "Group";
}

export function AiUsageCostBreakdownPanel(props: Props) {
  const pathname = usePathname() ?? "/administration/ai-usage";

  return (
    <Card data-testid="ai-usage-cost-breakdown-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Cost breakdown</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Estimated cost attribution for the selected grouping. Some dimensions require recent activity data.
        </p>
        <FilterChipGroup aria-label="Breakdown grouping" className="mt-3 flex flex-wrap gap-2">
          {GROUP_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              href={aiUsageGroupByHrefFromSearch(props.currentSearch, option.id, pathname)}
              scroll={false}
              className={buyerFilterChipClass(props.groupBy === option.id, false)}
              aria-current={props.groupBy === option.id ? "page" : undefined}
              data-testid={`ai-usage-group-by-${option.id}`}
              onClick={() => {
                props.onGroupByChange(option.id);
              }}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        <AiUsageSectionState
          state={props.state}
          title="cost breakdown"
          testId="ai-usage-cost-breakdown-state"
          emptyTitle={`No ${groupByLabel(props.groupBy).toLowerCase()} usage recorded`}
          emptyDescription="Once AI-assisted workflows run, attributed costs will appear in this breakdown."
        >
          {props.rows.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No attributed costs are available for the selected grouping yet.
            </p>
          ) : null}
          {props.rows.length > 0 ? (
            <EnterpriseTable ariaLabel="AI usage cost breakdown">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Usage count</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Tokens</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Estimated cost</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>% of total</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Details</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {props.rows.map((row) => (
                  <EnterpriseTableRow key={row.key}>
                    <EnterpriseTableCell className="font-medium text-al-text-primary">{row.name}</EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums text-al-text-secondary">
                      {row.usageCount.toLocaleString()}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className={cn("font-mono tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                      {(row.promptTokens + row.completionTokens).toLocaleString()}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums text-al-text-primary">
                      {formatCostReportingEstimatedUsd(row.estimatedCostUsd, props.currency)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums text-al-text-secondary">{row.percentOfTotal}%</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {row.detailHref !== null ? (
                        <Link href={row.detailHref} className={OPERATOR_LINK.nav}>
                          View
                        </Link>
                      ) : (
                        <span className="text-al-text-secondary">—</span>
                      )}
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
