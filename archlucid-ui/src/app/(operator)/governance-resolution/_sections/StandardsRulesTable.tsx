import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";
import { STANDARDS_RULES_TABLE_TITLE } from "@/lib/standards-rules-page";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
          {rows.map((row) => (
            <EnterpriseTableRow key={row.ruleKey}>
              <EnterpriseTableCell>{row.ruleName}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.standardFramework}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.category}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.severity}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.enforcementMode}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.sourcePolicyPack}</EnterpriseTableCell>
              <EnterpriseTableCell>
                {row.linkedFindingsHref !== null && row.linkedFindingsLabel !== null ? (
                  <Link className={OPERATOR_LINK.inline} href={row.linkedFindingsHref}>
                    {row.linkedFindingsLabel}
                  </Link>
                ) : (
                  <span className="text-al-text-secondary">—</span>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {row.evidenceHref !== null ? (
                  <Link className={OPERATOR_LINK.inline} href={row.evidenceHref}>
                    View evidence
                  </Link>
                ) : (
                  <span className="text-al-text-secondary">—</span>
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
