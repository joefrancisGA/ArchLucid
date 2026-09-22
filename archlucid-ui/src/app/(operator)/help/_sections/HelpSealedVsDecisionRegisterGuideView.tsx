import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_SECURENOW,
  DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_WORKING,
  DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE,
  DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY,
  DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY_HEADING,
  DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS,
  DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN,
  DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW,
  DESK_IA_HELP_SEALED_VS_REGISTER_PAGE_SUBTITLE,
  DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS,
  DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS,
  DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING,
  DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_SEAL_PROOFS,
  DESK_IA_HELP_SEALED_VS_REGISTER_TITLE,
  DESK_IA_HELP_SEALED_VS_REGISTER_TOPIC_LABEL,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-guide-content";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_TEST_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_CONTENT_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_LINK_LABEL,
  DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-page-copy";
import { DESK_IA_HELP_SEALED_VS_REGISTER_PATH } from "@/lib/desk-ia-help-sealed-vs-decision-register-route";
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
import { cn } from "@/lib/utils";

type HelpSealedVsDecisionRegisterGuideViewProps = {
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

function HelpSealedVsDecisionRegisterProvenanceLine(props: {
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
): typeof DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS {
  return DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** DI-023 — package (sealed review record) vs ledger (decision register). */
export function HelpSealedVsDecisionRegisterGuideView(
  props: HelpSealedVsDecisionRegisterGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const productLineId = resolveProductLineIdFromEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const contentGridClass = resolveHelpPageContentGridClass(DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const claimHeadingTitle =
    DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS.find(
      (heading) => heading.id === DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID,
    )?.title ?? "Package vs ledger";

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_TEST_ID}
    >
      <a href={`#${DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_LINK_LABEL}
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
            {DESK_IA_HELP_SEALED_VS_REGISTER_TOPIC_LABEL}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        title={DESK_IA_HELP_SEALED_VS_REGISTER_TITLE}
        titleTestId="help-sealed-vs-decision-register-page-title"
        subtitle={DESK_IA_HELP_SEALED_VS_REGISTER_PAGE_SUBTITLE}
        navHref={DESK_IA_HELP_SEALED_VS_REGISTER_PATH}
        headingLevel="h1"
        claimDiscipline={DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE}
        claimDisciplineTestId={DESK_IA_HELP_SEALED_VS_REGISTER_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        metadata={<HelpSealedVsDecisionRegisterProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div
            id={DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID}
            data-testid={DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID}
            className="space-y-4"
          >
            <p className={readingBodyClass} data-testid="help-sealed-vs-decision-register-overview">
              {DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW}
            </p>

            <section
              aria-labelledby={DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID}
              className="max-w-3xl space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-sealed-vs-decision-register-claim-discipline"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID}
                  className={cn(
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                    "m-0 scroll-mt-24 text-al-text-primary",
                    OPERATOR_TYPOGRAPHY.sectionTitle,
                  )}
                >
                  {claimHeadingTitle}
                </h2>
                <StatusTag kind="neutral" label="Separate surfaces" data-testid="help-sealed-vs-decision-register-claim-tag" />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE}
              </p>
            </section>
          </div>

          <section
            aria-labelledby="help-sealed-package-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-sealed-package"
          >
            <HelpSectionHeading id="help-sealed-package-heading">Sealed review record</HelpSectionHeading>
            <p className={readingBodyClass}>
              One finalized architecture package — manifest detail, exports, and findings for a single seal. Not a disposition
              ledger across the workspace.
            </p>
            <p className={readingBodyClass}>
              <Link
                className={OPERATOR_LINK.inline}
                href={DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.sealedRecords.href}
                data-testid="help-sealed-vs-decision-register-open-sealed-records"
              >
                {DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.sealedRecords.label}
              </Link>
            </p>
          </section>

          <section
            aria-labelledby="help-decision-register-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-decision-register"
          >
            <HelpSectionHeading id="help-decision-register-heading">Decision register</HelpSectionHeading>
            <p className={readingBodyClass}>
              Rows of recorded architecture decisions and approval outcomes. Each row may link to the sealed package that
              locked the decision — the register is not the package itself.
            </p>
            <p className={readingBodyClass}>
              <Link
                className={OPERATOR_LINK.inline}
                href={DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.decisionRegister.href}
                data-testid="help-sealed-vs-decision-register-open-decision-register"
              >
                {DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.decisionRegister.label}
              </Link>
            </p>
          </section>

          <section
            aria-labelledby="help-seal-integrity-heading"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-seal-integrity"
          >
            <HelpSectionHeading id="help-seal-integrity-heading">What a seal proves</HelpSectionHeading>
            <ul className={cn("m-0 list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
              {DESK_IA_HELP_SEALED_VS_REGISTER_SEAL_PROOFS.map((proof) => (
                <li key={proof}>{proof}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="help-sealed-vs-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-applicability"
          >
            <HelpSectionHeading id="help-sealed-vs-applicability">Scope and seat applicability</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-sealed-vs-decision-register-seat-working">
              {DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_WORKING}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-sealed-vs-decision-register-seat-securenow">
              {DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-sealed-vs-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-error-recovery"
          >
            <HelpSectionHeading id="help-sealed-vs-error-recovery">
              {DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY.whatFailed}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY.whatIsIntact}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY.nextStep}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby={DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-sealed-vs-decision-register-related-topics"
          >
            <HelpSectionHeading id={DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING_ID}>
              {DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING}
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
                href={DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN.href}
                data-testid="help-sealed-vs-decision-register-return-to-help"
              >
                {DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
