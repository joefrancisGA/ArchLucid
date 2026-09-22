import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEngineeringTroubleshootingProvenanceFooterProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Last-reviewed provenance for the engineering troubleshooting runbook. */
export function HelpEngineeringTroubleshootingProvenanceFooter(
  props: HelpEngineeringTroubleshootingProvenanceFooterProps,
): React.ReactElement {
  return (
    <footer
      className={cn(HELP_PAGE_LAYOUT.contentPanel, "border-t border-neutral-200 pt-4 dark:border-neutral-800")}
      data-testid="help-engineering-troubleshooting-provenance-footer"
    >
      <HelpTopicRegistryProvenanceLine entry={props.entry} />
    </footer>
  );
}
