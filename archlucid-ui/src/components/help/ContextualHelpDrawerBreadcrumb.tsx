import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/** Shell overlay trail for the contextual help drawer (HCD). */
export function ContextualHelpDrawerBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="contextual-help-drawer-breadcrumb"
      items={[
        { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
        { label: "Contextual help" },
      ]}
    />
  );
}
