import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  POLICY_PACK_DELTA_DEMO_HELP_APPLICABILITY_SECURENOW,
  POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH,
  POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
  POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY,
  POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY_HEADING,
  POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_HONESTY,
  POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_OFFLINE_TESTS,
  POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SCREENSHOT_CHECKLIST,
  POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SUMMARY,
  POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS,
  POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN,
  POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_DEEP_LINK,
  POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_SUMMARY,
  POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC,
  POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
  POLICY_PACK_DELTA_DEMO_HELP_RELATED_LINKS,
  POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING,
  POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING_ID,
  POLICY_PACK_DELTA_DEMO_HELP_TOPIC_LABEL,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import {
  POLICY_PACK_DELTA_DEMO_HELP_GUIDE_TEST_ID,
  POLICY_PACK_DELTA_DEMO_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_CONTENT_ID,
  POLICY_PACK_DELTA_DEMO_HELP_SKIP_LINK_LABEL,
  POLICY_PACK_DELTA_DEMO_HELP_SKIP_TARGET_ID,
} from "@/lib/policy/policy-pack-delta-demo-help-page-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPolicyPackDeltaDemoGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

/** SE/Admin policy-pack delta demo orientation for `/help/policy-pack-delta-demo` (TB-1726). */
export function HelpPolicyPackDeltaDemoGuideView(
  props: HelpPolicyPackDeltaDemoGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const staticHeadingIds = new Set(POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS.map((heading) => heading.id));
  const guideHeadings = [
    ...POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS,
    ...markdownHeadings.filter((heading) => !staticHeadingIds.has(heading.id)),
  ];
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={POLICY_PACK_DELTA_DEMO_HELP_GUIDE_TEST_ID}
    >
      <a href={`#${POLICY_PACK_DELTA_DEMO_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {POLICY_PACK_DELTA_DEMO_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <nav
        aria-label="Breadcrumb"
        className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-topic-breadcrumb"
      >
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
          <li>
            <Link className={OPERATOR_LINK.inline} href={HELP_HUB_CANONICAL_PATH}>
              {HELP_TOPIC_BREADCRUMB_HUB_LABEL}
            </Link>
          </li>
          <li aria-hidden="true" className="text-al-text-secondary">/</li>
          <li aria-current="page" className="text-al-text-primary">
            {POLICY_PACK_DELTA_DEMO_HELP_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        title={POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE}
        titleTestId="help-policy-pack-delta-demo-page-title"
        subtitle={POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE}
        navHref={POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH}
        headingLevel="h1"
        claimDiscipline={POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE}
        claimDisciplineTestId={POLICY_PACK_DELTA_DEMO_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-policy-pack-delta-demo-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className={contentGridClass}>
        <div
          id={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div id={POLICY_PACK_DELTA_DEMO_HELP_SKIP_TARGET_ID} className="space-y-4">
            <section
              aria-labelledby="help-policy-pack-delta-demo-arc-heading"
              data-testid="help-policy-pack-delta-demo-narrative-arc"
            >
              <HelpSectionHeading id="help-policy-pack-delta-demo-arc-heading">Narrative arc (5 minutes)</HelpSectionHeading>
              <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", readingBodyClass)}>
                {POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="help-policy-pack-delta-demo-impact-preview-heading"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-policy-pack-delta-demo-impact-preview"
            >
              <HelpSectionHeading id="help-policy-pack-delta-demo-impact-preview-heading">
                {POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_TITLE}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_SUMMARY}</p>
              <p className={readingBodyClass}>{POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_DEEP_LINK}</p>
            </section>

            <section
              aria-labelledby="help-policy-pack-delta-demo-finding-toggle-heading"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="help-policy-pack-delta-demo-finding-toggle"
            >
              <HelpSectionHeading id="help-policy-pack-delta-demo-finding-toggle-heading">
                {POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_TITLE}
              </HelpSectionHeading>
              <p className={readingBodyClass}>{POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SUMMARY}</p>
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Offline golden tests (CI)</h3>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", readingBodyClass)}>
                {POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_OFFLINE_TESTS.map((testName) => (
                  <li key={testName}>
                    <code>{testName}</code>
                  </li>
                ))}
              </ul>
              <h3 className={cn("m-0 mt-4", OPERATOR_TYPOGRAPHY.cardTitle)}>Screenshot checklist</h3>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", readingBodyClass)}>
                {POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SCREENSHOT_CHECKLIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={readingBodyClass} data-testid="help-policy-pack-delta-demo-finding-toggle-honesty">
                {POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_HONESTY}
              </p>
            </section>

            <p className={readingBodyClass} data-testid="help-policy-pack-delta-demo-overview">
              {POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW}
            </p>

            <section
              className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-policy-pack-delta-demo-action-panel"
              aria-labelledby="help-policy-pack-delta-demo-action-panel-heading"
            >
              <h2
                id="help-policy-pack-delta-demo-action-panel-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                Run the demo surfaces
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.href}>
                    {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.label}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openStandardsAndRules.href}>
                    {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openStandardsAndRules.label}
                  </Link>
                </Button>
                <Link
                  href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openAuditTrail.href}
                  className={cn(
                    "text-sm underline-offset-2 hover:underline",
                    DESIGN_TOKENS.accent.link,
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                >
                  {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
                </Link>
              </div>
            </section>
          </div>

          <section
            aria-labelledby="help-policy-pack-delta-demo-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-policy-pack-delta-demo-applicability"
          >
            <HelpSectionHeading id="help-policy-pack-delta-demo-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-policy-pack-delta-demo-seat-securenow">
              {POLICY_PACK_DELTA_DEMO_HELP_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-policy-pack-delta-demo-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-policy-pack-delta-demo-error-recovery"
          >
            <HelpSectionHeading id="help-policy-pack-delta-demo-error-recovery">
              {POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-policy-pack-delta-demo-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption="Policy-pack delta demo reference table"
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <section
            aria-labelledby={POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-policy-pack-delta-demo-related-topics"
          >
            <HelpSectionHeading id={POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING_ID}>
              {POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING}
            </HelpSectionHeading>
            <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
              {POLICY_PACK_DELTA_DEMO_HELP_RELATED_LINKS.map((topic) => (
                <li key={topic.href}>
                  <Link className={OPERATOR_LINK.nav} href={topic.href}>
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={readingBodyClass}>
              <Link
                className={OPERATOR_LINK.inline}
                href={POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN.href}
                data-testid="help-policy-pack-delta-demo-return-to-help"
              >
                {POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}
