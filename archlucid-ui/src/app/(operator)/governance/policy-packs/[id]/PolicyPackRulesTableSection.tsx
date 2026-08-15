import { cn } from "@/lib/utils";

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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ResponsibleAiRulesResolution } from "@/lib/policy/responsible-ai-policy-pack-rules";

type PolicyPackRulesTableSectionProps = {
  readonly headingId: string;
  readonly heading: string;
  readonly intro: string;
  readonly rulesResolution: ResponsibleAiRulesResolution;
  readonly ariaLabel: string;
  readonly emptyMessage?: string;
};

/** Shared rules table for policy pack detail variants (GPI). */
export function PolicyPackRulesTableSection(props: PolicyPackRulesTableSectionProps): React.JSX.Element {
  const { headingId, heading, intro, rulesResolution, ariaLabel, emptyMessage } = props;

  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <div className="space-y-1">
        <h3 id={headingId} className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {heading}
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-pack-rules-intro">
          {intro}
        </p>
        {rulesResolution.rulesSourceQualifier !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-pack-rules-source-qualifier">
            {rulesResolution.rulesSourceQualifier}
          </p>
        ) : null}
      </div>
      {rulesResolution.rows.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="policy-pack-rules-empty">
          {emptyMessage ?? "No published rules are available for this pack yet."}
        </p>
      ) : (
        <EnterpriseTable ariaLabel={ariaLabel} data-testid="policy-pack-rules-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Rule name</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Requirement</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Evidence expected</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {rulesResolution.rows.map((row) => (
              <EnterpriseTableRow key={row.ruleKey}>
                <EnterpriseTableCell>{row.ruleName}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <SeverityTag severity={row.severity} />
                </EnterpriseTableCell>
                <EnterpriseTableCell>{row.requirement}</EnterpriseTableCell>
                <EnterpriseTableCell>{row.evidenceExpected}</EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </section>
  );
}
