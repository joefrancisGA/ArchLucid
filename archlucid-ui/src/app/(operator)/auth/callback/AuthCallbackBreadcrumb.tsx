import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  AUTH_CALLBACK_BREADCRUMB_HUB_LABEL,
  AUTH_CALLBACK_BREADCRUMB_HUB_PATH,
  AUTH_CALLBACK_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/auth-callback-page-copy";

/** Ancestor trail for `/auth/callback`: Welcome → Completing sign-in. */
export function AuthCallbackBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="auth-callback-breadcrumb"
      items={[
        { label: AUTH_CALLBACK_BREADCRUMB_HUB_LABEL, href: AUTH_CALLBACK_BREADCRUMB_HUB_PATH },
        { label: AUTH_CALLBACK_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
