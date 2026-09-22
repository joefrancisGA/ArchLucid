import {
  ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_HEADING_ID,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_ANCHOR,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING } from "@/lib/engineering-troubleshooting-help-ia-dual";
import { ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING } from "@/lib/engineering-troubleshooting-help-related-guides";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

/** TOC order mirrors on-page layout: orientation → markdown → diligence follow-ups. */
export function buildEngineeringTroubleshootingHelpGuideHeadings(
  markdownHeadings: readonly HelpMarkdownHeading[],
): readonly HelpMarkdownHeading[] {
  const orientationHeadings: readonly HelpMarkdownHeading[] = [
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_ANCHOR,
      title: ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE,
      level: 2,
    },
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING,
      level: 2,
    },
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE,
      level: 2,
    },
  ];
  const appendixHeadings: readonly HelpMarkdownHeading[] = [
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.title,
      level: 2,
    },
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE,
      level: 2,
    },
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_TITLE,
      level: 2,
    },
    {
      id: ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING_ID,
      title: ENGINEERING_TROUBLESHOOTING_HELP_RELATED_HEADING,
      level: 2,
    },
  ];
  const reservedIds = new Set(
    [...orientationHeadings, ...appendixHeadings].map((heading) => heading.id),
  );
  const dedupedMarkdownHeadings = markdownHeadings.filter((heading) => !reservedIds.has(heading.id));

  return [...orientationHeadings, ...dedupedMarkdownHeadings, ...appendixHeadings];
}
