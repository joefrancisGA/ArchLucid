import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help-topic-applicability-metadata";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicRegistryProvenanceLineProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpTopicRegistryProvenanceLine(
  props: HelpTopicRegistryProvenanceLineProps,
): React.ReactElement | null {
  const provenance = formatHelpTopicApplicabilityMetadata(props.entry);

  if (provenance === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-topic-registry-provenance"
    >
      {provenance}
    </p>
  );
}
