import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

/** Core review trail for architecture create-bootstrap (ANE). */
export function ArchitecturesNewBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="architectures-new-breadcrumb"
      items={[
        {
          label: ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
          href: ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
        },
        {
          label: ARCHITECTURES_HUB_PAGE_TITLE,
          href: ARCHITECTURES_LIST_PATH,
        },
        { label: CREATE_ARCHITECTURE_LABEL },
      ]}
    />
  );
}
