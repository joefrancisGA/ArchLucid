"use client";

import Link from "next/link";
import { HelpSponsorReportPageHeader } from "@/app/(operator)/help/_sections/HelpSponsorReportPageHeader";
import { HelpPilotRoiMeasurementSection } from "@/app/(operator)/help/_sections/HelpPilotRoiMeasurementSection";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorReportHelpEvidenceOrientationStrip } from "@/components/help/SponsorReportHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SPONSOR_SUMMARY_HELP_OVERVIEW,
  SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS,
  SponsorReportHelpPageSubtitle,
} from "@/lib/sponsor-report-help-guide-content";
import { PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE } from "@/lib/sponsor/pilot-roi-measurement-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import {
  extractMarkdownSectionsByAnchor,
  omitMarkdownSectionsByAnchor,
} from "@/lib/help/help-markdown-sections";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSponsorReportGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe sponsor report orientation for `/help/sponsor-report`. */
export function HelpSponsorReportGuideView(
  props: HelpSponsorReportGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const presentationOptions = { helpTopicSlug: entry.slug };

  const sponsorBriefRaw = omitMarkdownSectionsByAnchor(markdown, ["pilot-roi-measurement"]);
  const pilotRoiRaw = extractMarkdownSectionsByAnchor(markdown, ["pilot-roi-measurement"], false);

  const preparedSponsorBrief = prepareHelpMarkdownForPresentation(sponsorBriefRaw, sourceDocPath, presentationOptions);
  const preparedPilotRoi = prepareHelpMarkdownForPresentation(pilotRoiRaw, sourceDocPath, presentationOptions);

  const headings = extractHelpMarkdownHeadings(
    [preparedSponsorBrief, preparedPilotRoi].filter((chunk) => chunk.trim().length > 0).join("\n\n"),
  ).map((heading) =>
    heading.id === "pilot-roi-measurement"
      ? { ...heading, title: PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE }
      : heading,
  );

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-sponsor-report-guide"
    >
      <HelpTopicHashScroll />

      <HelpSponsorReportPageHeader
        entry={entry}
        subtitle={SponsorReportHelpPageSubtitle(buyerPolishedShell)}
      />

      <SponsorReportHelpEvidenceOrientationStrip />

      <div className="space-y-4">
        <Card data-testid="help-sponsor-report-action-panel">
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Open sponsor outputs
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorValueReport.href}>
                {SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorValueReport.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorDashboard.href}>
                {SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorDashboard.label}
              </Link>
            </Button>
            <Link
              href={SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-sponsor-report-overview">
            {SPONSOR_SUMMARY_HELP_OVERVIEW}
          </p>

          {preparedSponsorBrief.trim().length > 0 ? (
            <div
              className={HELP_PAGE_LAYOUT.contentColumn}
              data-testid="help-sponsor-report-content"
            >
              <MarketingAccessibilityMarkdownFragment
                markdownBody={sponsorBriefRaw}
                tableCaption={`${entry.title} reference table`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
              />
            </div>
          ) : null}

          <HelpPilotRoiMeasurementSection
            markdown={pilotRoiRaw}
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
