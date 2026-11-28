import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowReaderInventoryPostureHonesty } from "@/lib/product-line/resolve-securenow-reader-inventory-posture-honesty";
import { cn } from "@/lib/utils";

export type SecureNowReaderInventoryPostureHonestyStripProps = { readonly testId: string; readonly honesty: SecureNowReaderInventoryPostureHonesty };

export function SecureNowReaderInventoryPostureHonestyStrip(props: SecureNowReaderInventoryPostureHonestyStripProps): React.JSX.Element {
  const td = props.testId;
  return (
    <section className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)} data-testid={td} aria-label="SecureNow reader inventory posture">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-lead"}>{props.honesty.lead}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={td + "-pull"}>{props.honesty.pullLine}</p>
    </section>
  );
}
