import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpInspectStoredEvidenceProvenanceFooterProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpInspectStoredEvidenceProvenanceFooter(
  props: HelpInspectStoredEvidenceProvenanceFooterProps,
): React.ReactElement {
  const sourceDocPath = props.entry.sourcePaths[0] ?? "";

  return (
    <footer
      className={cn(HELP_PAGE_LAYOUT.contentPanel, "border-t border-neutral-200 pt-4 dark:border-neutral-800")}
      data-testid="help-inspect-stored-evidence-provenance-footer"
    >
      <HelpTopicRegistryProvenanceLine entry={props.entry} />
      {sourceDocPath.length > 0 ? (
        <p
          className={cn("m-0 mt-2 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-inspect-stored-evidence-source-doc-path"
        >
          Source: {sourceDocPath}
        </p>
      ) : null}
    </footer>
  );
}
