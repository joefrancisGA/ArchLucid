"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { GovernanceInfrastructureDiagramsHelpEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-help-infrastructure-strips";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CANONICAL_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-diagrams-help-evidence-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_BREADCRUMB_TOPIC_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOCUS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HOW_IT_WORKS_STEPS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_OVERVIEW,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_EYEBROW,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_SUBTITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PARTITIONED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PNG_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID,
  governanceInfrastructureDiagramsHelpPrimaryAction,
  governanceInfrastructureDiagramsHelpReconcileAction,
} from "@/lib/governance/governance-infrastructure-diagrams-help-guide-content";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { cn } from "@/lib/utils";

type HelpGovernanceInfrastructureDiagramsGuideViewProps = {
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

function filterRelatedLinks(
  productLineId: ProductLineId,
): typeof GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS {
  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

/** Operator inventory diagrams orientation for `/help/governance-infrastructure-diagrams`. */
export function HelpGovernanceInfrastructureDiagramsGuideView(
  props: HelpGovernanceInfrastructureDiagramsGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const { productLine: productLineId } = useProductLine();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const primaryAction = governanceInfrastructureDiagramsHelpPrimaryAction(productLineId);
  const reconcileAction = governanceInfrastructureDiagramsHelpReconcileAction(productLineId);
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-governance-infrastructure-diagrams",
    GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_GUIDE_HEADINGS,
    GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-governance-infrastructure-diagrams-guide"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SKIP_LINK_LABEL}
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
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_BREADCRUMB_TOPIC_TITLE}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_EYEBROW}
        title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_TITLE}
        titleTestId="help-governance-infrastructure-diagrams-page-title"
        subtitle={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_SUBTITLE}
        navHref={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-governance-infrastructure-diagrams-header-actions"
          >
            <Button asChild size="sm" variant="primary">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={reconcileAction.href}>{reconcileAction.label}</Link>
            </Button>
          </div>
        }
      />

      <div className={contentGridClass}>
        <div
          id={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <p className={readingBodyClass} data-testid="help-governance-infrastructure-diagrams-overview">
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_OVERVIEW}
          </p>

          <div data-testid="help-governance-infrastructure-diagrams-orientation-strip">
            <GovernanceInfrastructureDiagramsHelpEvidenceOrientationStrip
              readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
            />
          </div>

          <section
            aria-labelledby="what-inventory-diagrams-show"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-inventory-diagrams-show">What inventory diagrams show</HelpSectionHeading>
            <p className={readingBodyClass}>{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_EMPTY_BODY}</p>
          </section>

          <section
            aria-labelledby="partitioned-fallbacks"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="partitioned-fallbacks">Partitioned fallbacks</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-governance-infrastructure-diagrams-partitioned-body">
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PARTITIONED_BODY}
            </p>
          </section>

          <section
            aria-labelledby="png-export"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="png-export">PNG export</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-governance-infrastructure-diagrams-png-body">
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PNG_BODY}
            </p>
          </section>

          <section
            aria-labelledby="focus-neighborhood"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="focus-neighborhood">Focus neighborhood</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-governance-infrastructure-diagrams-focus-body">
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOCUS_BODY}
            </p>
          </section>

          <section
            aria-labelledby="how-inventory-diagrams-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-inventory-diagrams-work">
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <ol className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HOW_IT_WORKS_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID}>
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING}
            </HelpSectionHeading>
            <p className={readingBodyClass}>{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE}</p>
          </section>

          <section
            aria-labelledby={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-governance-infrastructure-diagrams-related-topics"
          >
            <HelpSectionHeading id={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING_ID}>
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING}
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
                href={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN.href}
                data-testid="help-governance-infrastructure-diagrams-return-to-help"
              >
                {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN.label} →
              </Link>
            </p>
          </section>

          <SponsorSendPathHonestyPanel testIdPrefix="help-governance-infrastructure-diagrams" showSsoOptional={false} />
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}
