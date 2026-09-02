import { HelpStaticSection } from "@/components/help/HelpStaticSection";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help/help-heading-slug";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

export type HelpEngineeringTroubleshootingMarkdownSection = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export type HelpEngineeringTroubleshootingMarkdownSplit = {
  /** Markdown before the first `##` (goal, symptom index links, etc.). */
  readonly preamble: string;
  readonly sections: readonly HelpEngineeringTroubleshootingMarkdownSection[];
};

export function splitEngineeringTroubleshootingMarkdownSections(
  markdown: string,
): HelpEngineeringTroubleshootingMarkdownSplit {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  const sections: HelpEngineeringTroubleshootingMarkdownSection[] = [];
  const preambleLines: string[] = [];
  let currentTitle: string | null = null;
  let currentBodyLines: string[] = [];
  let seenFirstH2 = false;

  const flushSection = (): void => {
    if (currentTitle === null) {
      return;
    }

    const { id, title } = resolveHelpHeadingId(currentTitle, allocateSectionSlug);

    sections.push({
      id,
      title,
      body: currentBodyLines.join("\n").trim(),
    });
    currentTitle = null;
    currentBodyLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      flushSection();
      seenFirstH2 = true;
      currentTitle = line.slice(3).trim();
      continue;
    }

    if (!seenFirstH2) {
      preambleLines.push(line);
      continue;
    }

    if (currentTitle !== null) {
      currentBodyLines.push(line);
    }
  }

  flushSection();

  return {
    preamble: preambleLines.join("\n").trim(),
    sections,
  };
}

type HelpEngineeringTroubleshootingMarkdownSectionsProps = {
  readonly markdown: string;
  readonly sourceDocPath: string;
  readonly helpTopicSlug: string;
  readonly tableCaption: string;
};

/** Collapsed `##` sections for the engineering troubleshooting runbook (HDX). */
export function HelpEngineeringTroubleshootingMarkdownSections(
  props: HelpEngineeringTroubleshootingMarkdownSectionsProps,
): React.ReactElement {
  const { preamble, sections } = splitEngineeringTroubleshootingMarkdownSections(props.markdown);

  return (
    <div className="space-y-3" data-testid="help-engineering-troubleshooting-markdown-sections">
      {preamble.length > 0 ? (
        <div data-testid="help-engineering-troubleshooting-markdown-preamble">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={preamble}
            tableCaption={props.tableCaption}
            presentation="help"
            sourceDocPath={props.sourceDocPath}
            helpTopicSlug={props.helpTopicSlug}
            preserveMaintenanceMetadata
            preparedMarkdownOverride={preamble}
          />
        </div>
      ) : null}

      {sections.map((section) => (
        <HelpStaticSection
          key={section.id}
          id={section.id}
          headingLevel={2}
          title={section.title}
          testId="help-engineering-troubleshooting-markdown-section"
          bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
        >
          {section.body.length > 0 ? (
            <MarketingAccessibilityMarkdownFragment
              markdownBody={section.body}
              tableCaption={props.tableCaption}
              presentation="help"
              sourceDocPath={props.sourceDocPath}
              helpTopicSlug={props.helpTopicSlug}
              preserveMaintenanceMetadata
              preparedMarkdownOverride={section.body}
            />
          ) : null}
        </HelpStaticSection>
      ))}
    </div>
  );
}
