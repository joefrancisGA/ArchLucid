import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  AUTH_BOOTSTRAP_BREADCRUMB_HUB_LABEL,
  AUTH_BOOTSTRAP_BREADCRUMB_HUB_PATH,
  AUTH_BOOTSTRAP_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";

/** Ancestor trail for `/auth/bootstrap`: Welcome → Set up your workspace. */
export function PostAuthBootstrapBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="post-auth-bootstrap-breadcrumb"
      items={[
        { label: AUTH_BOOTSTRAP_BREADCRUMB_HUB_LABEL, href: AUTH_BOOTSTRAP_BREADCRUMB_HUB_PATH },
        { label: AUTH_BOOTSTRAP_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
