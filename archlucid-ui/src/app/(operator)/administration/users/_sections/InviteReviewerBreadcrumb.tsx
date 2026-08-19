import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

/** Administration trail for the invite-reviewer surface (SRI). */
export function InviteReviewerBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="invite-reviewer-breadcrumb"
      items={[
        { label: "Users and roles", href: SETTINGS_USERS_PATH },
        { label: INVITE_REVIEWER_PAGE_TITLE },
      ]}
    />
  );
}
