import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StandardsRulesSummary } from "@/lib/standards-rules-rows";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesSummaryStripProps = {
  readonly summary: StandardsRulesSummary;
};

export function StandardsRulesSummaryStrip(props: StandardsRulesSummaryStripProps) {
  const { summary } = props;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="standards-rules-summary-strip">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Standards in scope</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_KPI_CARD_DESCRIPTION)}>{summary.standardsInScope}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Rules enforced</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_KPI_CARD_DESCRIPTION)}>{summary.rulesEnforced}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Findings linked</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_KPI_CARD_DESCRIPTION)}>{summary.findingsLinked}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Source policy pack</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0 text-al-text-primary", OPERATOR_KPI_CARD_DESCRIPTION)}>{summary.primaryPolicyPack}</p>
        </CardContent>
      </Card>
    </div>
  );
}
