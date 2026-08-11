import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpPolicyPackDeltaDemoGuideView } from "@/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView";
import { HelpTopicAuthorityGate } from "@/app/(operator)/help/_sections/HelpTopicAuthorityGate";
import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS } from "@/lib/design-tokens";
import { tryLoadFoldedInternalRunbook } from "@/lib/load-product-documentation";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpPolicyPacksGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Policy packs help with folded Admin delta-demo runbook section (Batch R — POL → HEO). */
export function HelpPolicyPacksGuideView(props: HelpPolicyPacksGuideViewProps): React.ReactElement {
  const deltaDemo = tryLoadFoldedInternalRunbook("policy-pack-delta-demo");

  return (
    <>
      <HelpTopicHashScroll />
      <HelpTopicMarkdownView
        entry={props.entry}
        markdown={props.markdown}
        showContextualHelp
      />

      {deltaDemo !== null ? (
        <section
          id="policy-pack-delta-demo"
          className={OPERATOR_SHELL_SCROLL_OFFSET_CLASS}
          data-testid="help-policy-packs-folded-delta-demo"
        >
          <HelpTopicAuthorityGate entry={deltaDemo.entry} denied={null}>
            <HelpPolicyPackDeltaDemoGuideView
              entry={deltaDemo.entry}
              markdown={deltaDemo.markdown}
            />
          </HelpTopicAuthorityGate>
        </section>
      ) : null}
    </>
  );
}
