"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";
import { standardsRuleHasEvidence } from "@/lib/standards-rules-rows";
import { STANDARDS_RULES_TABLE_INTRO, STANDARDS_RULES_TABLE_TITLE } from "@/lib/standards-rules-page";
import {
  standardsRuleEnforcementStatusKind,
  standardsRuleEvidenceStatusKind,
  standardsRuleEvidenceStatusLabel,
  STANDARDS_RULES_INLINE_LINK_CLASS,
} from "@/lib/standards-rules-table-presentation";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { StandardsRulesPolicyPackReference } from "@/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesPolicyPackReference";

export type StandardsRulesTableProps = {
  readonly rows: readonly StandardsRuleRow[];
};

type SortKey = "ruleName" | "standardFramework" | "severity" | "enforcementMode";

const SEVERITY_ORDER: Readonly<Record<string, number>> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function compareRows(left: StandardsRuleRow, right: StandardsRuleRow, sortKey: SortKey, sortAsc: boolean): number {
  let result = 0;

  if (sortKey === "severity") {
    const leftRank = SEVERITY_ORDER[left.severity] ?? 99;
    const rightRank = SEVERITY_ORDER[right.severity] ?? 99;
    result = leftRank - rightRank;
  } else {
    result = left[sortKey].localeCompare(right[sortKey]);
  }

  return sortAsc ? result : -result;
}

function sortDirectionFor(
  activeKey: SortKey,
  currentKey: SortKey,
  sortAsc: boolean,
): "ascending" | "descending" | "none" {
  if (activeKey !== currentKey) {
    return "none";
  }

  return sortAsc ? "ascending" : "descending";
}

export function StandardsRulesTable(props: StandardsRulesTableProps) {
  const { rows } = props;
  const [sortKey, setSortKey] = useState<SortKey>("ruleName");
  const [sortAsc, setSortAsc] = useState(true);

  const sortedRows = useMemo(() => {
    const copy = [...rows];

    copy.sort((left, right) => compareRows(left, right, sortKey, sortAsc));

    return copy;
  }, [rows, sortAsc, sortKey]);

  function onSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortAsc((value) => !value);
      return;
    }

    setSortKey(nextKey);
    setSortAsc(true);
  }

  return (
    <section className="space-y-3" aria-labelledby="standards-rules-table-heading" data-testid="standards-rules-table">
      <div className="space-y-1">
        <h3 id="standards-rules-table-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {STANDARDS_RULES_TABLE_TITLE}
        </h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="standards-rules-table-intro">
          {STANDARDS_RULES_TABLE_INTRO}
        </p>
      </div>
      <EnterpriseTable ariaLabel={STANDARDS_RULES_TABLE_TITLE}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("ruleName", sortKey, sortAsc)}>
              <button type="button" className="font-inherit" onClick={() => onSort("ruleName")}>
                Rule
              </button>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("standardFramework", sortKey, sortAsc)}>
              <button type="button" className="font-inherit" onClick={() => onSort("standardFramework")}>
                Standard / Framework
              </button>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Category</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("severity", sortKey, sortAsc)}>
              <button type="button" className="font-inherit" onClick={() => onSort("severity")}>
                Severity
              </button>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("enforcementMode", sortKey, sortAsc)}>
              <button type="button" className="font-inherit" onClick={() => onSort("enforcementMode")}>
                Enforcement mode
              </button>
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source policy pack</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Linked findings</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {sortedRows.map((row) => {
            const hasLinkedFindings = row.linkedFindingsHref !== null && row.linkedFindingsLabel !== null;
            const hasEvidence = standardsRuleHasEvidence(row);

            return (
              <EnterpriseTableRow key={row.ruleKey}>
                <EnterpriseTableCell className={DESIGN_TOKENS.table.rowLabel}>{row.ruleName}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.standardFramework}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.category}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <SeverityTag severity={row.severity} label={row.severity} />
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={standardsRuleEnforcementStatusKind(row.enforcementMode)}
                    label={row.enforcementMode}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  {hasEvidence ? (
                    <FindingEvidenceLinkChip href={row.evidenceHref!} labelScope="column" />
                  ) : (
                    <StatusTag
                      kind={standardsRuleEvidenceStatusKind(row)}
                      label={standardsRuleEvidenceStatusLabel(row)}
                    />
                  )}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StandardsRulesPolicyPackReference
                    label={row.sourcePolicyPack}
                    href={row.sourcePolicyPackHref}
                    provenanceLabel={row.sourcePolicyPackProvenanceLabel}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  {hasLinkedFindings ? (
                    <Link className={STANDARDS_RULES_INLINE_LINK_CLASS} href={row.linkedFindingsHref}>
                      {row.linkedFindingsLabel}
                    </Link>
                  ) : (
                    <span className="text-al-text-secondary">—</span>
                  )}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
