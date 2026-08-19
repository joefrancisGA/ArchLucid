import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { humanizeMarkdownFileReference } from "@/lib/help/help-markdown-presentation";
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

      <CollapsibleSection
        title={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE}
        summaryLine={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO}
        sectionTestId="help-engineering-troubleshooting-sources"
      >
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {entry.sourcePaths.map((sourcePath) => (
            <li key={sourcePath}>{humanizeMarkdownFileReference(sourcePath)}</li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
