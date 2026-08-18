import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  AUTH_INVITE_BREADCRUMB_HUB_LABEL,
  AUTH_INVITE_BREADCRUMB_HUB_PATH,
  AUTH_INVITE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/auth-invite-page-copy";

/** Ancestor trail for `/auth/invite`: Welcome → Accept workspace invitation. */
export function InvitationAcceptBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="auth-invite-breadcrumb"
      items={[
        { label: AUTH_INVITE_BREADCRUMB_HUB_LABEL, href: AUTH_INVITE_BREADCRUMB_HUB_PATH },
        { label: AUTH_INVITE_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
