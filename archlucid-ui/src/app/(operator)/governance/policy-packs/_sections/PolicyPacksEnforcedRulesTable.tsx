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
import type { PolicyPackEnforcedRuleRow } from "@/lib/policy-pack-enforced-rules";
import { POLICY_PACKS_ENFORCED_RULES_TITLE } from "@/lib/policy-packs-page";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PolicyPacksEnforcedRulesTableProps = {
  readonly rows: readonly PolicyPackEnforcedRuleRow[];
};

export function PolicyPacksEnforcedRulesTable(props: PolicyPacksEnforcedRulesTableProps) {
  const { rows } = props;

  if (rows.length === 0) {
    return (
      <section className="space-y-2" aria-labelledby="policy-packs-enforced-rules-heading">
        <h3 id="policy-packs-enforced-rules-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {POLICY_PACKS_ENFORCED_RULES_TITLE}
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No compliance rules are currently enforced for this review.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="policy-packs-enforced-rules-heading" data-testid="policy-packs-enforced-rules-table">
      <h3 id="policy-packs-enforced-rules-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {POLICY_PACKS_ENFORCED_RULES_TITLE}
      </h3>
      <EnterpriseTable ariaLabel={POLICY_PACKS_ENFORCED_RULES_TITLE}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Rule name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Category</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Enforcement</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source policy pack</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((row) => (
            <EnterpriseTableRow key={row.ruleKey}>
              <EnterpriseTableCell>{row.ruleName}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.category}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.enforcementMode}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.sourcePackLabel}</EnterpriseTableCell>
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
