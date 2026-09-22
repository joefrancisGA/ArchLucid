import Link from "next/link";

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
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED,
  SYSTEM_GRAVITY_HELP_APPLICABILITY_SECURENOW,
  SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING,
  SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
  SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID,
  SYSTEM_GRAVITY_HELP_CONCEPT_TILES,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_HELP_RETURN,
  SYSTEM_GRAVITY_HELP_KEYBOARD_BODY,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING,
  SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID,
  SYSTEM_GRAVITY_HELP_TECHNICAL_BODY,
  SYSTEM_GRAVITY_HELP_TITLE,
  SYSTEM_GRAVITY_HELP_TOPIC_LABEL,
} from "@/lib/system-gravity-help-guide-content";
import {
  SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID,
  SYSTEM_GRAVITY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SYSTEM_GRAVITY_HELP_PRIMARY_CONTENT_ID,
  SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL,
  SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID,
} from "@/lib/system-gravity-help-page-copy";
import { SYSTEM_GRAVITY_HELP_PATH } from "@/lib/system-gravity-help-route";
import { cn } from "@/lib/utils";

type HelpSystemGravityGuideViewProps = {
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

function HelpSystemGravityProvenanceLine(props: {
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
  productLineId: ReturnType<typeof resolveProductLineIdFromEnv>,
): typeof SYSTEM_GRAVITY_HELP_RELATED_LINKS {
  return SYSTEM_GRAVITY_HELP_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** SG-107 — system vs job vs inspector orientation for `/help/system-gravity`. */
export function HelpSystemGravityGuideView(props: HelpSystemGravityGuideViewProps): React.ReactElement {
  const { entry } = props;
  const productLineId = resolveProductLineIdFromEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const contentGridClass = resolveHelpPageContentGridClass(SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const claimHeadingTitle =
    SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS.find((heading) => heading.id === SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID)?.title ??
    "Desk gravity on Working";

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID}
    >
      <a href={`#${SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL}
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
            {SYSTEM_GRAVITY_HELP_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        title={SYSTEM_GRAVITY_HELP_TITLE}
        titleTestId="help-system-gravity-page-title"
        subtitle={SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE}
        navHref={SYSTEM_GRAVITY_HELP_PATH}
        headingLevel="h1"
        claimDiscipline={SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE}
        claimDisciplineTestId={SYSTEM_GRAVITY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpSystemGravityProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={SYSTEM_GRAVITY_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div
            id={SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID}
            data-testid={SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID}
            className="space-y-4"
          >
            <p className={readingBodyClass} data-testid="help-system-gravity-overview">
              {SYSTEM_GRAVITY_HELP_OVERVIEW}
            </p>

            <section
              aria-labelledby={SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID}
              className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-system-gravity-claim-discipline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID}
                  className={cn(
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                    "m-0 scroll-mt-24 text-al-text-primary",
                    OPERATOR_TYPOGRAPHY.sectionTitle,
                  )}
                >
                  {claimHeadingTitle}
                </h2>
                <StatusTag kind="neutral" label="Desk is Home" data-testid="help-system-gravity-claim-tag" />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE}
              </p>
            </section>
          </div>

          <section
            aria-labelledby="what-system-gravity-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-concept-tiles"
          >
            <HelpSectionHeading id="what-system-gravity-shows">System, job, and inspector</HelpSectionHeading>
            <div className="grid gap-4 md:grid-cols-3">
              {SYSTEM_GRAVITY_HELP_CONCEPT_TILES.map((tile) => (
                <article
                  key={tile.id}
                  className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid={`help-system-gravity-tile-${tile.id}`}
                >
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{tile.title}</h3>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="help-system-gravity-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-applicability"
          >
            <HelpSectionHeading id="help-system-gravity-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-system-gravity-seat-working">
              {SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-system-gravity-seat-guided">
              {SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-system-gravity-seat-securenow">
              {SYSTEM_GRAVITY_HELP_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-system-gravity-record-practice"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-record-practice"
          >
            <HelpSectionHeading id="help-system-gravity-record-practice">Record vs Practice desk verbs</HelpSectionHeading>
            <p className={readingBodyClass}>{SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY}</p>
          </section>

          <section
            aria-labelledby="help-system-gravity-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-error-recovery"
          >
            <HelpSectionHeading id="help-system-gravity-error-recovery">
              {SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="help-system-gravity-keyboard"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-keyboard"
          >
            <HelpSectionHeading id="help-system-gravity-keyboard">Keyboard shortcuts</HelpSectionHeading>
            <p className={readingBodyClass}>{SYSTEM_GRAVITY_HELP_KEYBOARD_BODY}</p>
          </section>

          <section
            aria-labelledby="help-system-gravity-technical"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-technical"
          >
            <HelpSectionHeading id="help-system-gravity-technical">Technical reference</HelpSectionHeading>
            <p className={cn(readingBodyClass, "text-al-text-secondary")}>{SYSTEM_GRAVITY_HELP_TECHNICAL_BODY}</p>
          </section>

          <section
            aria-labelledby={SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-related-topics"
          >
            <HelpSectionHeading id={SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID}>
              {SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING}
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
                href={SYSTEM_GRAVITY_HELP_HELP_RETURN.href}
                data-testid="help-system-gravity-return-to-help"
              >
                {SYSTEM_GRAVITY_HELP_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
