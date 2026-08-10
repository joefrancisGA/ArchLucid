import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import {
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO,
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE,
} from "@/lib/governance-api-contracts-help-guide-content";
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

  return (
    <div className="space-y-2" data-testid="help-api-contracts-header-metadata">
      <HelpTopicRegistryProvenanceLine entry={entry} reviewedLabel="Last verified" />

      <CollapsibleSection
        title={GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE}
        summaryLine={GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO}
        sectionTestId="help-api-contracts-sources"
      >
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {entry.sourcePaths.map((sourcePath) => (
            <li key={sourcePath}>
              <code className="font-mono text-sm">{sourcePath}</code>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
