"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_DEMO,
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_GUIDED,
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_SECURENOW,
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_WORKING,
  MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE,
  MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY,
  MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY_HEADING,
  MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS,
  MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN,
  MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW,
  MODE_GRAVITY_HELP_WHICH_MODE_PAGE_SUBTITLE,
  MODE_GRAVITY_HELP_WHICH_MODE_RECORD_PRACTICE_BODY,
  MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS,
  MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING,
  MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_TITLE,
  MODE_GRAVITY_HELP_WHICH_MODE_TOPIC_LABEL,
} from "@/lib/mode-gravity-help-which-mode-guide-content";
import {
  MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_TEST_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_PRIMARY_CONTENT_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_SKIP_LINK_LABEL,
  MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID,
} from "@/lib/mode-gravity-help-which-mode-page-copy";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { cn } from "@/lib/utils";

type HelpWhichModeAmIInGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
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

function helpTopicSlugFromInAppHref(href: string): string | null {
  const normalized = href.trim();

  if (!normalized.startsWith("/help/")) {
    return null;
  }

  const slug = normalized.slice("/help/".length).split(/[?#]/)[0]?.trim() ?? "";

  return slug.length > 0 ? slug : null;
}

function HelpWhichModeAmIInProvenanceLine(props: {
  readonly entry: ProductDocumentationEntry;
}): React.ReactElement | null {
  const lastReviewed = props.entry.lastReviewed?.trim() ?? "";

  if (lastReviewed.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-topic-registry-provenance"
    >
      Guide last reviewed {lastReviewed}
    </p>
  );
}

function filterRelatedLinks(
  productLineId: ProductLineId,
): typeof MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS {
  return MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** MG-012 — Working vs Guided; then Career vs Rehearsal; demo/trial are eval. */
export function HelpWhichModeAmIInGuideView(props: HelpWhichModeAmIInGuideViewProps): React.ReactElement {
  const { entry } = props;
  const { productLine: productLineId } = useProductLine();
  const relatedLinks = filterRelatedLinks(productLineId);
  const contentGridClass = resolveHelpPageContentGridClass(MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const claimHeadingTitle =
    MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS.find((heading) => heading.id === MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID)
      ?.title ?? "Eval chrome is not Working Record";

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_TEST_ID}
    >
      <a href={`#${MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {MODE_GRAVITY_HELP_WHICH_MODE_SKIP_LINK_LABEL}
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
            {MODE_GRAVITY_HELP_WHICH_MODE_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        title={MODE_GRAVITY_HELP_WHICH_MODE_TITLE}
        titleTestId="help-which-mode-am-i-in-page-title"
        subtitle={MODE_GRAVITY_HELP_WHICH_MODE_PAGE_SUBTITLE}
        navHref={MODE_GRAVITY_HELP_WHICH_MODE_PATH}
        headingLevel="h1"
        claimDiscipline={MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE}
        claimDisciplineTestId={MODE_GRAVITY_HELP_WHICH_MODE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpWhichModeAmIInProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={MODE_GRAVITY_HELP_WHICH_MODE_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div
            id={MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID}
            data-testid={MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID}
            className="space-y-4"
          >
            <p className={readingBodyClass} data-testid="help-which-mode-am-i-in-overview">
              {MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW}
            </p>

            <section
              aria-labelledby={MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID}
              className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-which-mode-am-i-in-claim-discipline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID}
                  className={cn(
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                    "m-0 scroll-mt-24 text-al-text-primary",
                    OPERATOR_TYPOGRAPHY.sectionTitle,
                  )}
                >
                  {claimHeadingTitle}
                </h2>
                <StatusTag kind="neutral" label="Check mode labels" data-testid="help-which-mode-am-i-in-claim-tag" />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE}
              </p>
            </section>
          </div>

          <section
            aria-labelledby="help-which-mode-working-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-working"
          >
            <HelpSectionHeading id="help-which-mode-working-heading">Working</HelpSectionHeading>
            <p className={readingBodyClass}>{MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_WORKING}</p>
          </section>

          <section
            aria-labelledby="help-which-mode-guided-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-guided"
          >
            <HelpSectionHeading id="help-which-mode-guided-heading">Guided</HelpSectionHeading>
            <p className={readingBodyClass}>{MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_GUIDED}</p>
          </section>

          <section
            aria-labelledby="help-which-mode-eval-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-eval"
          >
            <HelpSectionHeading id="help-which-mode-eval-heading">Demo and trial</HelpSectionHeading>
            <p className={readingBodyClass}>{MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_DEMO}</p>
          </section>

          <section
            aria-labelledby="help-which-mode-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-applicability"
          >
            <HelpSectionHeading id="help-which-mode-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-which-mode-am-i-in-seat-securenow">
              {MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-which-mode-record-practice"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-record-practice"
          >
            <HelpSectionHeading id="help-which-mode-record-practice">Record vs Practice</HelpSectionHeading>
            <p className={readingBodyClass}>{MODE_GRAVITY_HELP_WHICH_MODE_RECORD_PRACTICE_BODY}</p>
          </section>

          <section
            aria-labelledby="help-which-mode-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-error-recovery"
          >
            <HelpSectionHeading id="help-which-mode-error-recovery">
              {MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby={MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-which-mode-am-i-in-related-topics"
          >
            <HelpSectionHeading id={MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING_ID}>
              {MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING}
            </HelpSectionHeading>
            <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
              {relatedLinks.map((topic) => (
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
                href={MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN.href}
                data-testid="help-which-mode-am-i-in-return-to-help"
              >
                {MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
