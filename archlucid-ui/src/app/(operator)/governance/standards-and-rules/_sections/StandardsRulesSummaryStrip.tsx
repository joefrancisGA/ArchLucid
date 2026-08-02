import { Card, CardContent } from "@/components/ui/card";
import type { StandardsRulesSummary } from "@/lib/standards-rules-rows";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesSummaryStripProps = {
  readonly summary: StandardsRulesSummary;
};

function SummaryMetricCard(props: { readonly label: string; readonly value: string; readonly testId: string }) {
  return (
    <Card data-testid={props.testId}>
      <CardContent className="px-4 py-3">
        <p className={cn("m-0 tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>{props.value}</p>
        <p className={cn("m-0 mt-1", OPERATOR_KPI_CARD_TITLE)}>{props.label}</p>
      </CardContent>
    </Card>
  );
}

export function StandardsRulesSummaryStrip(props: StandardsRulesSummaryStripProps) {
  const { summary } = props;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="standards-rules-summary-strip">
      <SummaryMetricCard
        testId="standards-rules-summary-standards"
        value={String(summary.standardsInScope)}
        label="Standards in scope"
      />
      <SummaryMetricCard
        testId="standards-rules-summary-rules"
        value={String(summary.rulesEnforced)}
        label="Rules enforced"
      />
      <SummaryMetricCard
        testId="standards-rules-summary-findings"
        value={String(summary.findingsLinked)}
        label="Findings linked"
      />
      <Card data-testid="standards-rules-summary-policy-pack">
        <CardContent className="px-4 py-3">
          <p className={cn("m-0 line-clamp-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {summary.primaryPolicyPack}
          </p>
          <p className={cn("m-0 mt-1", OPERATOR_KPI_CARD_TITLE)}>Source policy pack</p>
        </CardContent>
      </Card>
    </div>
  );
}
