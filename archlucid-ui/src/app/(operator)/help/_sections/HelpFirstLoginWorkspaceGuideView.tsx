"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
import {
  FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_GUIDED,
  FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_SECURENOW,
  FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_WORKING,
  FIRST_LOGIN_WORKSPACE_HELP_BLOCKED_REASON_VISIBLE,
  FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE,
  FIRST_LOGIN_WORKSPACE_HELP_CLAIM_HEADING_ID,
  FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY,
  FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY_HEADING,
  FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS,
  FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN,
  FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW,
  FIRST_LOGIN_WORKSPACE_HELP_PAGE_SUBTITLE,
  FIRST_LOGIN_WORKSPACE_HELP_RECORD_PRACTICE_BODY,
  FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_RELATED_LINKS,
  FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING,
  FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING_ID,
  FIRST_LOGIN_WORKSPACE_HELP_TITLE,
  FIRST_LOGIN_WORKSPACE_HELP_TOPIC_LABEL,
} from "@/lib/first-login-workspace-help-guide-content";
import {
  FIRST_LOGIN_WORKSPACE_HELP_GUIDE_TEST_ID,
  FIRST_LOGIN_WORKSPACE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  FIRST_LOGIN_WORKSPACE_HELP_PRIMARY_CONTENT_ID,
  FIRST_LOGIN_WORKSPACE_HELP_SKIP_LINK_LABEL,
  FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID,
} from "@/lib/first-login-workspace-help-page-copy";
import {
  FIRST_LOGIN_WORKSPACE_HELP_RETURN_TO_WORKSPACE_LABEL,
  resolveFirstLoginWorkspaceHelpReturnHref,
} from "@/lib/first-login-workspace-help-return";
import { FIRST_LOGIN_WORKSPACE_HELP_PATH } from "@/lib/first-login-workspace-help-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { cn } from "@/lib/utils";

type HelpFirstLoginWorkspaceGuideViewProps = {
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

function HelpFirstLoginWorkspaceProvenanceLine(props: {
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
      Guide last reviewed {lastReviewed} · LS-015
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

function filterRelatedLinks(
  productLineId: ReturnType<typeof resolveProductLineIdFromEnv>,
): typeof FIRST_LOGIN_WORKSPACE_HELP_RELATED_LINKS {
  return FIRST_LOGIN_WORKSPACE_HELP_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** LS-015 — first login, Training vs live workspace, Record vs Practice. */
export function HelpFirstLoginWorkspaceGuideView(
  props: HelpFirstLoginWorkspaceGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const searchParams = useSearchParams();
  const returnHref = resolveFirstLoginWorkspaceHelpReturnHref(searchParams.get("returnTo") ?? undefined);
  const productLineId = resolveProductLineIdFromEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const contentGridClass = resolveHelpPageContentGridClass(FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={FIRST_LOGIN_WORKSPACE_HELP_GUIDE_TEST_ID}
    >
      <a href={`#${FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {FIRST_LOGIN_WORKSPACE_HELP_SKIP_LINK_LABEL}
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
            {FIRST_LOGIN_WORKSPACE_HELP_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      {returnHref !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            className={OPERATOR_LINK.inline}
            href={returnHref}
            data-testid="help-first-login-workspace-return-to-workspace"
          >
            {FIRST_LOGIN_WORKSPACE_HELP_RETURN_TO_WORKSPACE_LABEL}
          </Link>
        </p>
      ) : null}

      <HelpTopicGuidePageHeader
        title={FIRST_LOGIN_WORKSPACE_HELP_TITLE}
        titleTestId="help-first-login-workspace-page-title"
        subtitle={FIRST_LOGIN_WORKSPACE_HELP_PAGE_SUBTITLE}
        navHref={FIRST_LOGIN_WORKSPACE_HELP_PATH}
        headingLevel="h1"
        claimDiscipline={FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE}
        claimDisciplineTestId={FIRST_LOGIN_WORKSPACE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpFirstLoginWorkspaceProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={FIRST_LOGIN_WORKSPACE_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div
            id={FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID}
            data-testid={FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID}
            className="space-y-4"
          >
            <p className={readingBodyClass} data-testid="help-first-login-workspace-overview">
              {FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW}
            </p>

            <section
              aria-labelledby={FIRST_LOGIN_WORKSPACE_HELP_CLAIM_HEADING_ID}
              className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-first-login-workspace-claim-discipline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={FIRST_LOGIN_WORKSPACE_HELP_CLAIM_HEADING_ID}
                  className={cn(
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                    "m-0 scroll-mt-24 text-al-text-primary",
                    OPERATOR_TYPOGRAPHY.sectionTitle,
                  )}
                >
                  Training is not live tenant proof
                </h2>
                <StatusTag kind="neutral" label="Not live data" data-testid="help-first-login-workspace-claim-tag" />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE}
              </p>
            </section>
          </div>

          <section
            aria-labelledby="help-first-login-invite-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-first-login-invite-heading">Invited users</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-invite">
              {FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION}
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-create-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-first-login-create-heading">Create or request access</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-create">
              {FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-first-login-workspace-blocked-reason">
              {FIRST_LOGIN_WORKSPACE_HELP_BLOCKED_REASON_VISIBLE}
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-choice-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-first-login-choice-heading">First-time Training question</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-first-choice">
              {FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION}
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-record-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-first-login-record-heading">Record, Practice, and Training</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-record-vs-training">
              {FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-first-login-workspace-record-practice">
              {FIRST_LOGIN_WORKSPACE_HELP_RECORD_PRACTICE_BODY}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")}>
              Review-type detail lives in{" "}
              <Link href="/help/career-vs-rehearsal" className={OPERATOR_LINK.inline}>
                Record and Practice
              </Link>
              . Workspace labels live in{" "}
              <Link href="/help/scope" className={OPERATOR_LINK.inline}>
                Workspace and scope
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-not-live-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="help-first-login-not-live-heading">NOT LIVE DATA unexpected</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-not-live">
              {FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION}
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-first-login-workspace-applicability"
          >
            <HelpSectionHeading id="help-first-login-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-first-login-workspace-seat-working">
              {FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_WORKING}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-first-login-workspace-seat-guided">
              {FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_GUIDED}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-first-login-workspace-seat-securenow">
              {FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-first-login-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-first-login-workspace-error-recovery"
          >
            <HelpSectionHeading id="help-first-login-error-recovery">
              {FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby={FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-first-login-workspace-related-topics"
          >
            <HelpSectionHeading id={FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING_ID}>
              {FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING}
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
                href={FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN.href}
                data-testid="help-first-login-workspace-return-to-help"
              >
                {FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
