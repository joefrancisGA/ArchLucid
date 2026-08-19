import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF,
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL,
  WHY_ARCHLUCID_PAGE_TITLE,
} from "@/lib/why-archlucid-page-copy";

/** Learning trail for Pilot proof telemetry (WH). */
export function WhyArchLucidBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="why-archlucid-page-breadcrumb"
      items={[
        { label: WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL, href: WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF },
        { label: WHY_ARCHLUCID_PAGE_TITLE },
      ]}
    />
  );
}
