import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import {
  API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO,
  API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE,
  formatApiContractsHelpReconciliationCopy,
} from "@/lib/api-contracts-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpApiContractsHeaderMetadataProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpApiContractsHeaderMetadata(
  props: HelpApiContractsHeaderMetadataProps,
): React.ReactElement {
  const { entry } = props;
  const sourcePath = entry.sourcePaths[0];
  const reconciliationCopy =
    entry.lastReviewed !== undefined
      ? formatApiContractsHelpReconciliationCopy(entry.lastReviewed)
      : null;

  return (
    <div className="space-y-2" data-testid="help-api-contracts-header-metadata">
      <HelpTopicRegistryProvenanceLine entry={entry} reviewedLabel="Last verified" />

      {reconciliationCopy !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="help-api-contracts-reconciliation">
          {reconciliationCopy}
        </p>
      ) : null}

      {sourcePath !== undefined ? (
        <div data-testid="help-api-contracts-sources">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
            {API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO}
          </p>
          <code className="mt-1 block font-mono text-sm">{sourcePath}</code>
        </div>
      ) : null}
    </div>
  );
}
