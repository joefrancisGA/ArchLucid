import {
  OperatorPageHeader,
  type OperatorPageHeaderProps,
} from "@/components/operator/OperatorPageHeader";

export type HelpTopicGuidePageHeaderProps = OperatorPageHeaderProps;

/** OperatorPageHeader preset for in-app help topic guides. */
export function HelpTopicGuidePageHeader(props: HelpTopicGuidePageHeaderProps): React.JSX.Element {
  return <OperatorPageHeader {...props} />;
}
