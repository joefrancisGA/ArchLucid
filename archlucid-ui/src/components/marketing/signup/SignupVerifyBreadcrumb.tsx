import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  SIGNUP_VERIFY_BREADCRUMB_HUB_LABEL,
  SIGNUP_VERIFY_BREADCRUMB_HUB_PATH,
  SIGNUP_VERIFY_BREADCRUMB_SIGNUP_LABEL,
  SIGNUP_VERIFY_BREADCRUMB_SIGNUP_PATH,
  SIGNUP_VERIFY_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/signup-verify-page-copy";

/** Ancestor trail for `/signup/verify`: Welcome → Start your evaluation → Verify email. */
export function SignupVerifyBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="signup-verify-breadcrumb"
      items={[
        { label: SIGNUP_VERIFY_BREADCRUMB_HUB_LABEL, href: SIGNUP_VERIFY_BREADCRUMB_HUB_PATH },
        { label: SIGNUP_VERIFY_BREADCRUMB_SIGNUP_LABEL, href: SIGNUP_VERIFY_BREADCRUMB_SIGNUP_PATH },
        { label: SIGNUP_VERIFY_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
