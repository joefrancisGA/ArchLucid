import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  PRICING_BREADCRUMB_HUB_LABEL,
  PRICING_BREADCRUMB_HUB_PATH,
  PRICING_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/pricing-page-copy";

/** Ancestor trail for `/pricing`: Welcome → Pricing. */
export function PricingBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="pricing-breadcrumb"
      items={[
        { label: PRICING_BREADCRUMB_HUB_LABEL, href: PRICING_BREADCRUMB_HUB_PATH },
        { label: PRICING_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
