import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  HELP_HUB_CANONICAL_PATH,
  HELP_TOPIC_BREADCRUMB_HUB_LABEL,
} from "@/lib/help/help-hub-evidence-copy";

export type HelpTopicBreadcrumbProps = {
  readonly topicTitle: string;
};

/** Ancestor trail for in-app help topics: Help & support → current topic. */
export function HelpTopicBreadcrumb(props: HelpTopicBreadcrumbProps): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="help-topic-breadcrumb"
      items={[
        { label: HELP_TOPIC_BREADCRUMB_HUB_LABEL, href: HELP_HUB_CANONICAL_PATH },
        { label: props.topicTitle },
      ]}
    />
  );
}
