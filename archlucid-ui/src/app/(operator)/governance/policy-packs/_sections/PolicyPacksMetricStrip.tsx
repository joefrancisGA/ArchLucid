import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { policyPackTypeDisplayLabel } from "@/lib/policy/policy-pack-type-label";
import type { EffectivePolicyPackSet, PolicyPack } from "@/types/policy-packs";

export type PolicyPacksMetricStripProps = {
  buyerPolishedShell: boolean;
  packCount: number;
  effective: EffectivePolicyPackSet | null;
  selectedPackSummary: PolicyPack | undefined;
};

export function PolicyPacksMetricStrip(props: PolicyPacksMetricStripProps) {
  const { buyerPolishedShell, packCount, effective, selectedPackSummary } = props;

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Registered packs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue)}>{packCount}</p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>Visible in this workspace</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {buyerPolishedShell ? "Rules applied to this review" : "Effective layers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue)}>{effective?.packs.length ?? 0}</p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
            {buyerPolishedShell
              ? "Checks enforced for your scope (merged policy layers)"
              : "Resolved for current scope"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>Selected pack</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {selectedPackSummary !== undefined ? selectedPackSummary.name : "—"}
          </p>
          {selectedPackSummary !== undefined ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
              {policyPackTypeDisplayLabel(selectedPackSummary.packType)}
            </p>
          ) : null}
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
            {buyerPolishedShell ? "Overview for this workspace snapshot" : "Inspect versions and effective policy"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
