import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL } from "@/lib/architecture/architecture-draft-detail-page-copy";
import {
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
  ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

export type ArchitectureDraftDetailBreadcrumbProps = {
  readonly draftLabel: string;
};

/** Core review trail for a saved architecture draft detail (ARR). */
export function ArchitectureDraftDetailBreadcrumb(
  props: ArchitectureDraftDetailBreadcrumbProps,
): React.JSX.Element {
  const draftLabel = props.draftLabel.trim() || ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL;

  return (
    <OperatorPageBreadcrumb
      data-testid="architecture-draft-detail-breadcrumb"
      items={[
        {
          label: ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL,
          href: ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF,
        },
        {
          label: ARCHITECTURES_HUB_PAGE_TITLE,
          href: ARCHITECTURES_LIST_PATH,
        },
        { label: draftLabel },
      ]}
    />
  );
}
