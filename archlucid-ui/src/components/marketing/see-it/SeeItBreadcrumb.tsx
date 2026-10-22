import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  SEE_IT_BREADCRUMB_HUB_LABEL,
  SEE_IT_BREADCRUMB_HUB_PATH,
  SEE_IT_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/see-it-page-copy";

/** Ancestor trail for `/see-it`: Welcome → sample review page. */
export function SeeItBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="see-it-breadcrumb"
      items={[
        { label: SEE_IT_BREADCRUMB_HUB_LABEL, href: SEE_IT_BREADCRUMB_HUB_PATH },
        { label: SEE_IT_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
