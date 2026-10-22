import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  HELP_HUB_BREADCRUMB_HUB_LABEL,
  HELP_HUB_BREADCRUMB_HUB_PATH,
  HELP_HUB_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/help/help-hub-page-copy";

/** Ancestor trail for `/help`: Welcome → Help. */
export function HelpHubBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="help-hub-breadcrumb"
      items={[
        { label: HELP_HUB_BREADCRUMB_HUB_LABEL, href: HELP_HUB_BREADCRUMB_HUB_PATH },
        { label: HELP_HUB_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
