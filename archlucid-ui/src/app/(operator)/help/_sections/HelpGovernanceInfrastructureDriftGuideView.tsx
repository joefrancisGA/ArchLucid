import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { GovernanceInfrastructureDriftHelpEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-help-infrastructure-strips";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
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
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_BREADCRUMB_TOPIC_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_EYEBROW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SNAPSHOT_PRECONDITION_TAG,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_CARD_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_PRECONDITION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_SECONDARY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TILE_ITEMS,
  governanceInfrastructureDriftHelpPageSubtitle,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-governance-infrastructure-drift",
    GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
    GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);

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

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_EYEBROW}
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE}
        titleTestId="help-governance-infrastructure-drift-page-title"
        subtitle={governanceInfrastructureDriftHelpPageSubtitle(buyerPolishedShell)}
        navHref={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_BREADCRUMB_TOPIC_TITLE} />}
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
          {buyerPolishedShell ? (
            <div data-testid="help-governance-infrastructure-drift-orientation-top">
              <GovernanceInfrastructureDriftHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}

          {!buyerPolishedShell ? <DriftHelpStartHerePanel /> : null}

          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-governance-infrastructure-drift-overview"
          >
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="what-drift-workbench-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-drift-workbench-shows">What the drift workbench shows</HelpSectionHeading>
            <DriftHelpTileGrid
              items={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TILE_ITEMS}
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
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-governance-infrastructure-drift-table-body">
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_BODY}
            </p>
            <DriftHelpTileGrid
              items={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS}
              testId="help-governance-infrastructure-drift-table-columns"
            />
          </section>

          {!buyerPolishedShell ? (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <GovernanceInfrastructureDriftHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}
