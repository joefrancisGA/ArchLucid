import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowAcceleratorTemplateRichnessHonesty } from "@/lib/product-line/resolve-securenow-accelerator-template-richness-honesty";
import { cn } from "@/lib/utils";

export type SecureNowAcceleratorTemplateRichnessHonestyStripProps = {
  readonly testId: string;
  readonly honesty: SecureNowAcceleratorTemplateRichnessHonesty;
};

export function SecureNowAcceleratorTemplateRichnessHonestyStrip(props: SecureNowAcceleratorTemplateRichnessHonestyStripProps): React.JSX.Element {
  const td = props.testId;
  return (
    <section className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)} data-testid={td} aria-label="Accelerator template richness honesty">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-lead"}>{props.honesty.lead}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={td + "-fixture"}>{props.honesty.fixtureLine}</p>
    </section>
  );
}
