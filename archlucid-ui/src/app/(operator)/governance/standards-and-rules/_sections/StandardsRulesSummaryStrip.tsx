import { Card, CardContent } from "@/components/ui/card";
import type { StandardsRulesFilterState, StandardsRulesSummary } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_SUMMARY_EVIDENCE_COVERAGE_LABEL,
  STANDARDS_RULES_SUMMARY_LINKED_FINDINGS_LABEL,
} from "@/lib/standards-rules-page";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesSummaryStripProps = {
  readonly summary: StandardsRulesSummary;
  readonly onApplyFilter: (next: Partial<StandardsRulesFilterState>) => void;
};

function SummaryMetricCard(props: {
  readonly label: string;
  readonly value: string;
  readonly testId: string;
  readonly onClick?: () => void;
  readonly pressed?: boolean;
}) {
  const interactive = props.onClick !== undefined;

  return (
    <Card
      data-testid={props.testId}
      className={cn(
        interactive &&
          "cursor-pointer transition hover:border-[var(--al-accent-interactive)] focus-within:ring-2 focus-within:ring-[var(--al-accent-interactive)]",
        props.pressed === true && "border-[var(--al-accent-interactive)]",
      )}
    >
      <CardContent className="px-4 py-3">
        {interactive ? (
          <button
            type="button"
            className="m-0 w-full border-0 bg-transparent p-0 text-left"
            aria-pressed={props.pressed === true}
            onClick={props.onClick}
          >
            <p className={cn("m-0 tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>{props.value}</p>
            <p className={cn("m-0 mt-1", OPERATOR_KPI_CARD_TITLE)}>{props.label}</p>
          </button>
        ) : (
          <>
            <p className={cn("m-0 tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>{props.value}</p>
            <p className={cn("m-0 mt-1", OPERATOR_KPI_CARD_TITLE)}>{props.label}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StandardsRulesSummaryStrip(props: StandardsRulesSummaryStripProps) {
  const { summary, onApplyFilter } = props;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="standards-rules-summary-strip">
      <SummaryMetricCard
        testId="standards-rules-summary-standards"
        value={String(summary.standardsInScope)}
        label="Standards in scope"
        onClick={() => {
          onApplyFilter({
            standardFramework: "all",
            severity: "all",
            enforcementMode: "all",
            sourcePolicyPack: "all",
            linkedFindings: "all",
            evidenceCoverage: "all",
          });
        }}
      />
      <SummaryMetricCard
        testId="standards-rules-summary-rules"
        value={String(summary.rulesEnforced)}
        label="Rules enforced"
        onClick={() => {
          onApplyFilter({
            standardFramework: "all",
            severity: "all",
            enforcementMode: "all",
            sourcePolicyPack: "all",
            linkedFindings: "all",
            evidenceCoverage: "all",
          });
        }}
      />
      <SummaryMetricCard
        testId="standards-rules-summary-findings"
        value={String(summary.rulesWithLinkedFindings)}
        label={STANDARDS_RULES_SUMMARY_LINKED_FINDINGS_LABEL}
        onClick={() => {
          onApplyFilter({ linkedFindings: "linked" });
        }}
      />
      <SummaryMetricCard
        testId="standards-rules-summary-evidence"
        value={`${summary.evidencedRules}/${summary.rulesEnforced} (${summary.evidenceCoverageLabel})`}
        label={STANDARDS_RULES_SUMMARY_EVIDENCE_COVERAGE_LABEL}
        onClick={() => {
          onApplyFilter({ evidenceCoverage: "unevidenced" });
        }}
      />
    </div>
  );
}
