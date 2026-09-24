import Link from "next/link";

import { HelpSystemGravityRecoverLinks } from "@/app/(operator)/help/_sections/HelpSystemGravityRecoverLinks";
import {
  HelpSystemGravityPracticeTag,
  HelpSystemGravityRecordPracticeTags,
  HelpSystemGravityRecordTag,
} from "@/app/(operator)/help/_sections/HelpSystemGravityRecordPracticeTags";
import { HelpSystemGravityTechnicalReference } from "@/app/(operator)/help/_sections/HelpSystemGravityTechnicalReference";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
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
import {
  isHelpTopicExcludedForProductLine,
  isSecureNowProductLine,
} from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED,
  SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING,
  SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
  SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO,
  SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_HEADING,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_INTRO,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_PRACTICE_EFFECTS,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_RECORD_EFFECTS,
  SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_BODY,
  SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_LINK,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING,
  SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID,
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

function HelpKeyboardKey(props: { readonly children: string }): React.ReactElement {
  return (
    <kbd
      className={cn(
        "rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
        OPERATOR_TYPOGRAPHY.micro,
      )}
    >
      {props.children}
    </kbd>
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
    if (link.architectureProductLineOnly === true && isSecureNowProductLine(productLineId)) {
      return false;
    }

    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** SG-107 — architecture desk vs nested review inspector orientation for `/help/system-gravity`. */
export function HelpSystemGravityGuideView(props: HelpSystemGravityGuideViewProps): React.ReactElement {
  const { entry } = props;
  const productLineId = resolveProductLineIdFromEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const contentGridClass = resolveHelpPageContentGridClass(SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

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
          </div>

          <section
            aria-labelledby="help-system-gravity-key-terms"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-desk-home-definitions"
          >
            <HelpSectionHeading id="help-system-gravity-key-terms">Key terms</HelpSectionHeading>
            <dl className={cn("m-0 grid max-w-3xl gap-3", HELP_PAGE_LAYOUT.readingBody)}>
              {SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS.map((row) => (
                <div key={row.term}>
                  <dt className="font-medium text-al-text-primary">{row.term}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{row.definition}</dd>
                </div>
              ))}
            </dl>
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
                <dt className="font-medium text-al-text-primary">If it fails</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.ifItFails}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stays intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.whatStaysIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Recover</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">
                  {SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.recover}{" "}
                  <HelpSystemGravityRecoverLinks />.
                </dd>
              </div>
            </dl>
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
          </section>

          <section
            aria-labelledby="help-system-gravity-record-practice"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-record-practice"
          >
            <HelpSectionHeading id="help-system-gravity-record-practice">
              {SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_HEADING}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-system-gravity-record-practice-intro">
              <HelpSystemGravityRecordPracticeTags /> — {SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_INTRO}
            </p>
            <p className={readingBodyClass} data-testid="help-system-gravity-record-practice-record-effects">
              <HelpSystemGravityRecordTag /> — {SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_RECORD_EFFECTS}
            </p>
            <p className={readingBodyClass} data-testid="help-system-gravity-record-practice-practice-effects">
              <HelpSystemGravityPracticeTag /> — {SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_PRACTICE_EFFECTS}
            </p>
            <p className={readingBodyClass} data-testid="help-system-gravity-record-what-if-cap">
              {SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_BODY}{" "}
              <Link
                className={OPERATOR_LINK.inline}
                href={SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_LINK.href}
                data-testid="help-system-gravity-record-what-if-cap-link"
              >
                {SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_LINK.label}
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby="help-system-gravity-keyboard"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-keyboard"
          >
            <HelpSectionHeading id="help-system-gravity-keyboard">Keyboard shortcuts</HelpSectionHeading>
            <p className={readingBodyClass}>{SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO}</p>
            <div className="max-w-3xl overflow-x-auto">
              <table
                className={cn("w-full border-collapse text-left", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-system-gravity-keyboard-table"
              >
                <caption className="sr-only">Working keyboard shortcuts for architecture desk gravity</caption>
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th scope="col" className="py-2 pr-4 font-medium text-al-text-primary">Keys</th>
                    <th scope="col" className="py-2 font-medium text-al-text-primary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS.map((row) => (
                    <tr
                      key={row.keys}
                      className="border-b border-neutral-100 dark:border-neutral-800/80"
                    >
                      <th scope="row" className="py-2 pr-4 font-medium text-al-text-primary">
                        <HelpKeyboardKey>{row.keys}</HelpKeyboardKey>
                      </th>
                      <td className="py-2 text-al-text-secondary">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-labelledby="help-system-gravity-technical"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-system-gravity-technical"
          >
            <HelpSystemGravityTechnicalReference />
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
          </section>
        </div>

        <HelpTopicTableOfContents headings={SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
