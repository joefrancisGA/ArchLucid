import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { GovernanceInfrastructureDriftHelpEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-help-infrastructure-strips";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_APPLICABILITY_SECURENOW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_APPLICABILITY_WORKING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_BREADCRUMB_TOPIC_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_EYEBROW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_TOPICS_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_TOPICS_HEADING_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SNAPSHOT_PRECONDITION_TAG,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_CARD_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_PRECONDITION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_SECONDARY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_TITLE,
  governanceInfrastructureDriftHelpTileItems,
  governanceInfrastructureDriftHelpPageSubtitle,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { cn } from "@/lib/utils";

type HelpGovernanceInfrastructureDriftGuideViewProps = {
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
  productLineId: ReturnType<typeof resolveProductLineIdFromEnv>,
): typeof GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_LINKS {
  return GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_LINKS.filter((link) => {
    const slug = helpTopicSlugFromInAppHref(link.href);

    if (slug === null) {
      return true;
    }

    return !isHelpTopicExcludedForProductLine(slug, productLineId);
  });
}

function DriftHelpStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-governance-infrastructure-drift-action-panel"
      aria-labelledby="help-governance-infrastructure-drift-action-panel-heading"
    >
      <h2
        id="help-governance-infrastructure-drift-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_CARD_TITLE}
      </h2>
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="help-governance-infrastructure-drift-start-here-precondition"
      >
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_PRECONDITION}
        </p>
      </aside>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.href}>
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_SECONDARY_ACTION.href}>
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_SECONDARY_ACTION.label}
          </Link>
        </Button>
      </div>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-governance-infrastructure-drift-start-here-helper"
      >
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

function HowDriftCompareWorksSteps(): React.ReactElement {
  return (
    <ol
      className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="help-governance-infrastructure-drift-how-stepper"
    >
      {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS.map((step, index) => (
        <li key={step} className="flex min-w-0 gap-3">
          <span className="sr-only">{`Step ${index + 1}`}</span>
          <span aria-hidden className={HELP_PAGE_LAYOUT.workflowStepNumber}>
            {index + 1}
          </span>
          <p className={cn("m-0 min-w-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

function DriftHelpTileGrid(props: {
  readonly items: readonly { readonly label: string; readonly detail: string }[];
  readonly testId: string;
}): React.ReactElement {
  return (
    <dl
      className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
      data-testid={props.testId}
    >
      {props.items.map((item) => (
        <div key={item.label}>
          <dt className="font-medium text-al-text-primary">{item.label}</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Operator drift and snapshots orientation for `/help/governance-infrastructure-drift`. */
export function HelpGovernanceInfrastructureDriftGuideView(
  props: HelpGovernanceInfrastructureDriftGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const productLineId = resolveProductLineIdFromEnv();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const relatedLinks = filterRelatedLinks(productLineId);
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-governance-infrastructure-drift",
    GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
    GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-governance-infrastructure-drift-guide"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL}
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
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_BREADCRUMB_TOPIC_TITLE}
          </li>
        </ol>
      </nav>

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_EYEBROW}
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE}
        titleTestId="help-governance-infrastructure-drift-page-title"
        subtitle={governanceInfrastructureDriftHelpPageSubtitle(buyerPolishedShell)}
        navHref={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-col items-start gap-2"
            data-testid="help-governance-infrastructure-drift-header-actions"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.href}>
                  {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <StatusTag
                kind="neutral"
                label={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SNAPSHOT_PRECONDITION_TAG}
                data-testid="help-governance-infrastructure-drift-snapshot-precondition-tag"
              />
            </div>
          </div>
        }
      />

      <div className={contentGridClass}>
        <div
          id={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          {!buyerPolishedShell ? <DriftHelpStartHerePanel /> : null}

          <p className={readingBodyClass} data-testid="help-governance-infrastructure-drift-overview">
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW}
          </p>

          <div data-testid="help-governance-infrastructure-drift-orientation-strip">
            <GovernanceInfrastructureDriftHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>

          <section
            aria-labelledby="what-drift-workbench-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-drift-workbench-shows">What the drift workbench shows</HelpSectionHeading>
            <DriftHelpTileGrid
              items={governanceInfrastructureDriftHelpTileItems(productLineId)}
              testId="help-governance-infrastructure-drift-tile-items"
            />
          </section>

          <section
            aria-labelledby="how-drift-compare-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-drift-compare-works">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <HowDriftCompareWorksSteps />
          </section>

          <section
            aria-labelledby="reading-the-drift-table"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="reading-the-drift-table">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_TITLE}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-governance-infrastructure-drift-table-body">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_BODY}
            </p>
            <DriftHelpTileGrid
              items={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS}
              testId="help-governance-infrastructure-drift-table-columns"
            />
          </section>

          <section
            aria-labelledby="help-governance-infrastructure-drift-applicability"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-governance-infrastructure-drift-applicability"
          >
            <HelpSectionHeading id="help-governance-infrastructure-drift-applicability">
              Scope and seat applicability
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-governance-infrastructure-drift-seat-working">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_APPLICABILITY_WORKING}
            </p>
            <p
              className={cn(readingBodyClass, "text-al-text-secondary")}
              data-testid="help-governance-infrastructure-drift-seat-securenow"
            >
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_APPLICABILITY_SECURENOW}
            </p>
          </section>

          <section
            aria-labelledby="help-governance-infrastructure-drift-error-recovery"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-governance-infrastructure-drift-error-recovery"
          >
            <HelpSectionHeading id="help-governance-infrastructure-drift-error-recovery">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY_HEADING}
            </HelpSectionHeading>
            <dl className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}>
              <div>
                <dt className="font-medium text-al-text-primary">What failed</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">
                  {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY.whatFailed}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">What stayed intact</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">
                  {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY.whatIsIntact}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Next step</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">
                  {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_ERROR_RECOVERY.nextStep}
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-governance-infrastructure-drift-related-topics"
          >
            <HelpSectionHeading id={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_TOPICS_HEADING_ID}>
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_TOPICS_HEADING}
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
                href={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HELP_RETURN.href}
                data-testid="help-governance-infrastructure-drift-return-to-help"
              >
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HELP_RETURN.label} →
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}
