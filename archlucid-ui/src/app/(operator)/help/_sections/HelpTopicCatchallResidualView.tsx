import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicCatchallResidualViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
  readonly showContextualHelp?: boolean;
};

/** Terminal `/help/[...topic]` markdown fallthrough — buyer-polished chrome for HE. residual path. */
export function HelpTopicCatchallResidualView(props: HelpTopicCatchallResidualViewProps): React.ReactElement {
  return (
    <HelpTopicMarkdownView
      entry={props.entry}
      markdown={props.markdown}
      showContextualHelp={props.showContextualHelp}
      catchallResidualBuyerChrome
    />
  );
}
