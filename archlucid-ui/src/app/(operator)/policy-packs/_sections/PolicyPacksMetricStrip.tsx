import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardTitle className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Registered packs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="m-0 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{packCount}</p>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">Visible in this workspace</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {buyerPolishedShell ? "Rules applied to this review" : "Effective layers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="m-0 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {effective?.packs.length ?? 0}
          </p>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {buyerPolishedShell
              ? "Checks enforced for your scope (merged policy layers)"
              : "Resolved for current scope"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Selected pack</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {selectedPackSummary !== undefined ? selectedPackSummary.name : "—"}
          </p>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {buyerPolishedShell ? "Overview for this workspace snapshot" : "Inspect versions and effective policy"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
