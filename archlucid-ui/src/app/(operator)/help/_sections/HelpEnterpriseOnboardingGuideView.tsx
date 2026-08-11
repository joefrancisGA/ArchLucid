import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import { EnterpriseOnboardingHubSteps } from "@/components/help/EnterpriseOnboardingHubSteps";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS,
} from "@/lib/enterprise-onboarding-help-copy";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEnterpriseOnboardingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty hosted enterprise onboarding checklist for `/help/enterprise-onboarding` (TB-1338 / TB-1342). */
export function HelpEnterpriseOnboardingGuideView(
  props: HelpEnterpriseOnboardingGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = [
    { id: "onboarding-hub", title: "Onboarding hub", level: 2 as const },
    ...extractHelpMarkdownHeadings(preparedMarkdown),
  ];

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-enterprise-onboarding-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION}
      />

      <div
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid="help-enterprise-onboarding-first-viewport"
      >
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-enterprise-onboarding-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Start tenant onboarding
            </CardTitle>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-enterprise-onboarding-overview">
              {ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW}
            </p>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.configureSso.href}>
                {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.configureSso.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openIdentityProviders.href}>
                {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openIdentityProviders.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openUsersAndRoles.href}>
                {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openUsersAndRoles.label}
              </Link>
            </Button>
            <Link
              href={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openCloudConnections.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openCloudConnections.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-topic-content">
          <EnterpriseOnboardingHubSteps />
          <EnterpriseOnboardingHelpEvidenceOrientationStrip />
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
