import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  GET_STARTED_BREADCRUMB_HUB_LABEL,
  GET_STARTED_BREADCRUMB_HUB_PATH,
  GET_STARTED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/get-started-page-copy";

/** Ancestor trail for `/get-started`: Welcome → Get started. */
export function GetStartedBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="get-started-breadcrumb"
      items={[
        { label: GET_STARTED_BREADCRUMB_HUB_LABEL, href: GET_STARTED_BREADCRUMB_HUB_PATH },
        { label: GET_STARTED_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
