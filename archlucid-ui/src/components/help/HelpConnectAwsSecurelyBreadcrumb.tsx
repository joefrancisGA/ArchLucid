import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  CLOUD_CONNECTIONS_HELP_PAGE_TITLE,
  CLOUD_CONNECTIONS_HELP_PATH,
} from "@/lib/cloud-connections-help-guide-content";
import {
  HELP_HUB_CANONICAL_PATH,
  HELP_TOPIC_BREADCRUMB_HUB_LABEL,
} from "@/lib/help/help-hub-evidence-copy";

export type HelpConnectAwsSecurelyBreadcrumbProps = {
  readonly topicTitle: string;
};

/** Ancestor trail for Connect AWS securely help (HEC). */
export function HelpConnectAwsSecurelyBreadcrumb(
  props: HelpConnectAwsSecurelyBreadcrumbProps,
): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="help-connect-aws-securely-breadcrumb"
      items={[
        { label: HELP_TOPIC_BREADCRUMB_HUB_LABEL, href: HELP_HUB_CANONICAL_PATH },
        { label: CLOUD_CONNECTIONS_HELP_PAGE_TITLE, href: CLOUD_CONNECTIONS_HELP_PATH },
        { label: props.topicTitle },
      ]}
    />
  );
}
