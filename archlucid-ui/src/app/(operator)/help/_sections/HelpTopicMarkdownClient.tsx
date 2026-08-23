"use client";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { HelpApiContractsGuideView } from "@/app/(operator)/help/_sections/HelpApiContractsGuideView";
import { HelpConfigurationReferenceGuideView } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView";
import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";
import { HelpTopicNotFoundView } from "@/app/(operator)/help/_sections/HelpTopicNotFoundView";
import { HelpTopicLoadFailureView } from "@/app/(operator)/help/_sections/HelpTopicLoadFailureView";
import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { useHelpTopicMarkdownQuery } from "@/hooks/use-help-topic-markdown-query";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpTopicMarkdownClientProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpTopicMarkdownClient(props: HelpTopicMarkdownClientProps): React.ReactElement {
  const markdownQuery = useHelpTopicMarkdownQuery(props.entry.slug);

  if (markdownQuery.isPending) {
    return <OperatorShellAccessGateLoading />;
  }

  if (markdownQuery.isError) {
    return <HelpTopicLoadFailureView />;
  }

  if (markdownQuery.data === undefined) {
    return <HelpTopicNotFoundView />;
  }

  const markdown = markdownQuery.data;

  if (props.entry.slug === "engineering-troubleshooting") {
    return <HelpEngineeringTroubleshootingGuideView entry={props.entry} markdown={markdown} />;
  }

  if (props.entry.slug === "configuration-reference") {
    return <HelpConfigurationReferenceGuideView entry={props.entry} markdown={markdown} />;
  }

  if (props.entry.slug === "api-contracts") {
    return <HelpApiContractsGuideView entry={props.entry} markdown={markdown} />;
  }

  return (
    <HelpTopicMarkdownView
      entry={props.entry}
      markdown={markdown}
      showContextualHelp
    />
  );
}
