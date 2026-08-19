import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { TRUST_CENTER_PUBLIC_PATH } from "@/lib/marketing-assurance-public-labels";
import {
  PRIVACY_POLICY_BREADCRUMB_HUB_LABEL,
  PRIVACY_POLICY_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/privacy-policy-page-copy";

/** Ancestor trail for the public privacy policy: Trust Center → Privacy Policy. */
export function PrivacyPolicyBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="privacy-policy-breadcrumb"
      items={[
        { label: PRIVACY_POLICY_BREADCRUMB_HUB_LABEL, href: TRUST_CENTER_PUBLIC_PATH },
        { label: PRIVACY_POLICY_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
