import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

/** Core review trail for the architecture drafts hub (ARA). */
export function ArchitecturesHubBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="architectures-hub-breadcrumb"
      items={[
        {
          label: ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
          href: ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
        },
        { label: ARCHITECTURES_HUB_PAGE_TITLE },
      ]}
    />
  );
}
