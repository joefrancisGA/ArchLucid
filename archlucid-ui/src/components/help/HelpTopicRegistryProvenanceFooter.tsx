import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpTopicRegistryProvenanceFooterProps = {
  readonly entry: ProductDocumentationEntry;
  readonly testId?: string;
};

/** Last-reviewed provenance footer for specialty help guides. */
export function HelpTopicRegistryProvenanceFooter(
  props: HelpTopicRegistryProvenanceFooterProps,
): React.ReactElement {
  return (
    <footer
      className={cn(HELP_PAGE_LAYOUT.contentPanel, "border-t border-neutral-200 pt-4 dark:border-neutral-800")}
      data-testid={props.testId ?? `help-${props.entry.slug}-provenance-footer`}
    >
      <HelpTopicRegistryProvenanceLine entry={props.entry} />
    </footer>
  );
}
