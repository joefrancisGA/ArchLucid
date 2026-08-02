import Link from "next/link";

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
import { STANDARDS_RULES_TABLE_TITLE } from "@/lib/standards-rules-page";
import { standardsRuleEnforcementStatusKind } from "@/lib/standards-rules-table-presentation";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesTableProps = {
  readonly rows: readonly StandardsRuleRow[];
};

export function StandardsRulesTable(props: StandardsRulesTableProps) {
  const { rows } = props;

  return (
    <section className="space-y-3" aria-labelledby="standards-rules-table-heading" data-testid="standards-rules-table">
      <h3 id="standards-rules-table-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {STANDARDS_RULES_TABLE_TITLE}
      </h3>
      <EnterpriseTable ariaLabel={STANDARDS_RULES_TABLE_TITLE}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Rule</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Standard / framework</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Category</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Enforcement mode</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source policy pack</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Linked findings</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((row) => {
            const hasLinkedFindings = row.linkedFindingsHref !== null && row.linkedFindingsLabel !== null;

            return (
              <EnterpriseTableRow key={row.ruleKey} selected={hasLinkedFindings}>
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
                <EnterpriseTableCell>{row.sourcePolicyPack}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  {hasLinkedFindings ? (
                    <Link className={cn(OPERATOR_LINK.inline, "font-semibold")} href={row.linkedFindingsHref}>
                      {row.linkedFindingsLabel}
                    </Link>
                  ) : (
                    <span className="text-al-text-secondary">—</span>
                  )}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  {row.evidenceHref !== null ? (
                    <FindingEvidenceLinkChip href={row.evidenceHref} />
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
