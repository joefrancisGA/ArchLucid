import { HelpEngineeringTroubleshootingSourcesDisclosure } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingSourcesDisclosure";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEngineeringTroubleshootingHeaderMetadataProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpEngineeringTroubleshootingHeaderMetadata(
  props: HelpEngineeringTroubleshootingHeaderMetadataProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="space-y-2" data-testid="help-engineering-troubleshooting-header-metadata">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
        <span className="font-medium text-al-text-primary">
          {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.documentTitle}
        </span>
      </p>
      <HelpEngineeringTroubleshootingSourcesDisclosure entry={entry} />
    </div>
  );
}
