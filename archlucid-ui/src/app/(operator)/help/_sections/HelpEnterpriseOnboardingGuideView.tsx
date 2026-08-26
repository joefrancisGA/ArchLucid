import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EnterpriseOnboardingHelpClaimDisciplineStrip } from "@/components/help/EnterpriseOnboardingHelpClaimDisciplineStrip";
import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import { EnterpriseOnboardingHubSteps } from "@/components/help/EnterpriseOnboardingHubSteps";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS,
} from "@/lib/enterprise-onboarding-help-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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
  const headings = resolveGuideHeadingsForStrip(
    "enterprise-onboarding-help",
    appendHelpClaimDisciplineTocHeadings(
      [
        { id: "onboarding-hub", title: "Onboarding hub", level: 2 as const },
        ...extractHelpMarkdownHeadings(preparedMarkdown),
      ],
      ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
    ),
    ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-enterprise-onboarding-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION}
      />

      <EnterpriseOnboardingHelpClaimDisciplineStrip />

      <div className="space-y-6" data-testid="help-enterprise-onboarding-first-viewport">
        <section
          className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="help-enterprise-onboarding-action-panel"
          aria-labelledby="help-enterprise-onboarding-action-panel-heading"
        >
          <h2
            id="help-enterprise-onboarding-action-panel-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Start tenant onboarding
          </h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-enterprise-onboarding-overview">
            {ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
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
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openCloudConnections.label}
            </Link>
          </div>
        </section>
      </div>

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-topic-content">
          <EnterpriseOnboardingHelpEvidenceOrientationStrip />

          <EnterpriseOnboardingHubSteps />

          <div className="min-w-0">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>
    </article>
  );
}
