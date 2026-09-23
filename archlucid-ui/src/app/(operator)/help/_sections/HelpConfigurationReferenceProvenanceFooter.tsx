import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { CONFIGURATION_REFERENCE_HELP_PROVENANCE_DISCLOSURE_TITLE } from "@/lib/configuration-reference-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { humanizeMarkdownFileReference } from "@/lib/help-markdown/link-rewrites";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpConfigurationReferenceProvenanceFooterProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Source document and last-reviewed provenance for configuration reference. */
export function HelpConfigurationReferenceProvenanceFooter(
  props: HelpConfigurationReferenceProvenanceFooterProps,
): React.ReactElement {
  const { entry } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";

  return (
    <footer
      className={cn(HELP_PAGE_LAYOUT.contentPanel, "border-t border-neutral-200 pt-4 dark:border-neutral-800")}
      data-testid="help-configuration-reference-provenance-footer"
    >
      <HelpTopicRegistryProvenanceLine entry={entry} />
      {sourceDocPath.length > 0 ? (
        <>
          <p
            className={cn("m-0 mt-2 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-configuration-reference-source-doc-path-inline"
          >
            Source: {sourceDocPath}
          </p>
          <details className={HELP_PAGE_LAYOUT.details}>
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {CONFIGURATION_REFERENCE_HELP_PROVENANCE_DISCLOSURE_TITLE}
            </summary>
            <p
              className={cn("m-0 mt-2 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-configuration-reference-source-doc-path"
            >
              {sourceDocPath}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {humanizeMarkdownFileReference(sourceDocPath)}
            </p>
          </details>
        </>
      ) : null}
    </footer>
  );
}
