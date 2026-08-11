import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { PolicyPacksHelpEvidenceOrientationStrip } from "@/components/help/PolicyPacksHelpEvidenceOrientationStrip";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpPolicyPacksGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Customer policy packs help — markdown body with Evidence orientation (HEO). */
export function HelpPolicyPacksGuideView(props: HelpPolicyPacksGuideViewProps): React.ReactElement {
  return (
    <HelpTopicMarkdownView
      entry={props.entry}
      markdown={props.markdown}
      showContextualHelp
      evidenceOrientation={<PolicyPacksHelpEvidenceOrientationStrip />}
    />
  );
}
