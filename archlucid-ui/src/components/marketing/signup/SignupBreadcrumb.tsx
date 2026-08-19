import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  SIGNUP_BREADCRUMB_HUB_LABEL,
  SIGNUP_BREADCRUMB_HUB_PATH,
  SIGNUP_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/signup-page-copy";

/** Ancestor trail for `/signup`: Welcome → Start your evaluation. */
export function SignupBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="signup-breadcrumb"
      items={[
        { label: SIGNUP_BREADCRUMB_HUB_LABEL, href: SIGNUP_BREADCRUMB_HUB_PATH },
        { label: SIGNUP_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
