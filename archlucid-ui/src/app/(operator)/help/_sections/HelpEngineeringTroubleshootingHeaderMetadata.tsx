import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE,
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
        <span>
          {" "}
          · {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.documentVersion}
        </span>
      </p>
      <HelpTopicRegistryProvenanceLine entry={entry} reviewedLabel="Last verified" />

      <CollapsibleSection
        title={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE}
        summaryLine={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO}
        sectionTestId="help-engineering-troubleshooting-sources"
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
