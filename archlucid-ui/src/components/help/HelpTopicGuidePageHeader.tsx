import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import {
  OperatorPageHeader,
  type OperatorPageHeaderProps,
} from "@/components/operator/OperatorPageHeader";

export type HelpTopicGuidePageHeaderProps = OperatorPageHeaderProps & {
  /** Visible topic title for the breadcrumb current page segment. */
  readonly topicTitle: string;
};

/** OperatorPageHeader with the shared Help & Support → topic breadcrumb trail. */
export function HelpTopicGuidePageHeader(props: HelpTopicGuidePageHeaderProps): React.JSX.Element {
  const { topicTitle, ...headerProps } = props;

  return (
    <OperatorPageHeader
      {...headerProps}
      breadcrumb={<HelpTopicBreadcrumb topicTitle={topicTitle} />}
    />
  );
}
