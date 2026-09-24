"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
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
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_GUIDED,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_SECURENOW,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_WORKING,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_HEADING_ID,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY_HEADING,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_BODY,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_SHORTCUTS_HREF,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_NO_RETRY_BODY,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PAGE_SUBTITLE,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RECORD_PRACTICE_BODY,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_LINKS,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING_ID,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TECHNICAL_BODY,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TOPIC_LABEL,
} from "@/lib/daytime-wait-help-proxy-timeout-guide-content";
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_TEST_ID,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PRIMARY_CONTENT_ID,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_LINK_LABEL,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_TARGET_ID,
} from "@/lib/daytime-wait-help-proxy-timeout-page-copy";
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RETURN_TO_REVIEW_LABEL,
  resolveProxyTimeoutHelpReturnHref,
} from "@/lib/daytime-wait-help-proxy-timeout-return";
import { DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH } from "@/lib/daytime-wait-help-proxy-timeout-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { cn } from "@/lib/utils";

type HelpProxyTimeoutRealExecuteGuideViewProps = {
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

function HelpProxyTimeoutProvenanceLine(props: {
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
      Guide last reviewed {lastReviewed} · DW-007
    </p>
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

/** DW-007 — proxy timeout vs Record Real execute. */
export function HelpProxyTimeoutRealExecuteGuideView(
  props: HelpProxyTimeoutRealExecuteGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const searchParams = useSearchParams();
  const returnToReviewHref = resolveProxyTimeoutHelpReturnHref(searchParams.get("returnTo") ?? undefined);
  const { productLine: productLineId } = useProductLine();
  const relatedLinks = DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
  const contentGridClass = resolveHelpPageContentGridClass(DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_TEST_ID}
    >
      <a href={`#${DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_LINK_LABEL}
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
          <li aria-hidden="true" className="text-al-text-secondary">
            /
          </li>
          <li aria-current="page" className="text-al-text-primary">
            {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      {returnToReviewHref !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            className={OPERATOR_LINK.inline}
            href={returnToReviewHref}
            data-testid="help-proxy-timeout-real-execute-return-to-review"
          >
            {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RETURN_TO_REVIEW_LABEL}
          </Link>
        </p>
      ) : null}

      <HelpTopicGuidePageHeader
        title={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE}
        titleTestId="help-proxy-timeout-real-execute-page-title"
        subtitle={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PAGE_SUBTITLE}
        navHref={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH}
        headingLevel="h1"
        claimDiscipline={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE}
        claimDisciplineTestId={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpProxyTimeoutProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div id={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_TARGET_ID} className="space-y-4">
            <p className={readingBodyClass} data-testid="help-proxy-timeout-real-execute-overview">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW}
            </p>

            <section
              aria-labelledby={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_HEADING_ID}
              className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-proxy-timeout-real-execute-claim-discipline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_HEADING_ID}
                  className={cn(
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                    "m-0 scroll-mt-24 text-al-text-primary",
                    OPERATOR_TYPOGRAPHY.sectionTitle,
                  )}
                >
                  Timeout is not failure proof
                </h2>
                <StatusTag kind="neutral" label="Check operations first" data-testid="help-proxy-timeout-claim-tag" />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE}
              </p>
            </section>
          </div>

          <section
            aria-labelledby="help-proxy-timeout-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-proxy-timeout-applicability"
          >
            <HelpSectionHeading id="help-proxy-timeout-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-proxy-timeout-seat-working">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_WORKING}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-proxy-timeout-seat-guided">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_GUIDED}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-proxy-timeout-seat-securenow">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-proxy-timeout-record-practice"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-proxy-timeout-record-practice">Record vs Practice after timeout</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-proxy-timeout-record-practice">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RECORD_PRACTICE_BODY}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-proxy-timeout-no-retry">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_NO_RETRY_BODY}
            </p>
          </section>

          <section
            aria-labelledby="help-proxy-timeout-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-proxy-timeout-error-recovery"
          >
            <HelpSectionHeading id="help-proxy-timeout-error-recovery">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="help-proxy-timeout-keyboard"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-proxy-timeout-keyboard">Keyboard and in-flight strip</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-proxy-timeout-keyboard">
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_BODY}
            </p>
            <p className={readingBodyClass}>
              <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_SHORTCUTS_HREF}>
                Open Review shortcuts →
              </Link>
            </p>
          </section>

          <section
            aria-labelledby="help-proxy-timeout-technical"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-proxy-timeout-technical"
          >
            <HelpSectionHeading id="help-proxy-timeout-technical">Technical reference</HelpSectionHeading>
            <p className={cn(readingBodyClass, "text-al-text-secondary")}>{DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TECHNICAL_BODY}</p>
          </section>

          <section
            aria-labelledby={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-proxy-timeout-related-topics"
          >
            <HelpSectionHeading id={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING_ID}>
              {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING}
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
                href={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN.href}
                data-testid="help-proxy-timeout-return-to-help"
              >
                {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
