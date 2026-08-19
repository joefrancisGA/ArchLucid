import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  SHOWCASE_BREADCRUMB_HUB_LABEL,
  SHOWCASE_BREADCRUMB_HUB_PATH,
  SHOWCASE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/showcase-page-copy";

/** Ancestor trail for `/showcase/[runId]`: See it → sample showcase. */
export function ShowcaseBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="showcase-breadcrumb"
      items={[
        { label: SHOWCASE_BREADCRUMB_HUB_LABEL, href: SHOWCASE_BREADCRUMB_HUB_PATH },
        { label: SHOWCASE_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
