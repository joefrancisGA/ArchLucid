import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { presentAnalysisCoverage, type AnalysisCoverage } from "@/lib/analysis-coverage";

export function AnalysisCoverageNotice({ coverage }: { readonly coverage?: AnalysisCoverage | null }) {
  const { kind, label, detail } = presentAnalysisCoverage(coverage);

  return (
    <div className="space-y-1" data-testid="analysis-coverage">
      <StatusTag kind={kind} label={label} />
      <p className={OPERATOR_TYPOGRAPHY.helper}>{detail}</p>
    </div>
  );
}
