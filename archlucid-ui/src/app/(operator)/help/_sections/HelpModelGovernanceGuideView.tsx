import Link from "next/link";

import { HelpModelGovernanceHeaderActions } from "@/app/(operator)/help/_sections/HelpModelGovernanceHeaderActions";
import { HelpModelGovernanceSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpModelGovernanceSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ModelGovernanceHelpClaimDisciplineStrip } from "@/components/help/ModelGovernanceHelpClaimDisciplineStrip";
import { ModelGovernanceHelpEvidenceOrientationStrip } from "@/components/help/ModelGovernanceHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_EMBEDDINGS,
  MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_LEAD,
  MODEL_GOVERNANCE_HELP_DATA_HANDLING_HREF,
  MODEL_GOVERNANCE_HELP_FEATURE_ITEMS,
  MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID,
  MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS,
  MODEL_GOVERNANCE_HELP_HOW_TO_READ_STEPS,
  MODEL_GOVERNANCE_HELP_OVERVIEW,
  MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE,
  MODEL_GOVERNANCE_HELP_PAGE_TITLE,
  MODEL_GOVERNANCE_HELP_PRIMARY_ACTION,
  MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE,
  MODEL_GOVERNANCE_HELP_SUBPROCESSORS_HREF,
} from "@/lib/model-governance-help-guide-content";
import {
  MODEL_GOVERNANCE_HELP_CANONICAL_PATH,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
} from "@/lib/model-governance-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_FIRST_VIEWPORT_TEST_ID,
  MODEL_GOVERNANCE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  MODEL_GOVERNANCE_HELP_PRIMARY_CONTENT_ID,
  MODEL_GOVERNANCE_HELP_SKIP_LINK_LABEL,
  MODEL_GOVERNANCE_HELP_SKIP_TARGET_ID,
} from "@/lib/model-governance-help-page-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpModelGovernanceGuideViewProps = {
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

function ModelGovernanceStartHereActionPanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-model-governance-action-panel"
      aria-labelledby="help-model-governance-action-panel-heading"
    >
      <h2
        id="help-model-governance-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE}
      </h2>
      <Button asChild size="sm" variant="primary" data-testid="help-model-governance-start-here-primary-cta">
        <Link href={MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href}>
          {MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
    </section>
  );
}

/** Operator model approval orientation for `/help/model-governance`. */
export function HelpModelGovernanceGuideView(props: HelpModelGovernanceGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-model-governance",
    MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS,
    MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-model-governance-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${MODEL_GOVERNANCE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {MODEL_GOVERNANCE_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      <div
        id={buyerPolishedShell ? MODEL_GOVERNANCE_HELP_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? MODEL_GOVERNANCE_HELP_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24 space-y-6", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={MODEL_GOVERNANCE_HELP_PAGE_TITLE}
          titleTestId="help-model-governance-page-title"
          subtitle={MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE}
          navHref={MODEL_GOVERNANCE_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={buyerPolishedShell ? MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={
            buyerPolishedShell ? MODEL_GOVERNANCE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
          }
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpModelGovernanceHeaderActions />}
        />

        {buyerPolishedShell ? null : <ModelGovernanceHelpClaimDisciplineStrip />}

        {buyerPolishedShell ? (
          <div
            id={MODEL_GOVERNANCE_HELP_SKIP_TARGET_ID}
            data-testid={MODEL_GOVERNANCE_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <ModelGovernanceStartHereActionPanel />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {buyerPolishedShell ? null : (
              <ModelGovernanceHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            )}

            <p className={readingBodyClass} data-testid="help-model-governance-overview">
              {MODEL_GOVERNANCE_HELP_OVERVIEW}
            </p>

            {buyerPolishedShell ? null : <ModelGovernanceStartHereActionPanel />}

            <section
              aria-labelledby="data-boundary"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="data-boundary">Data boundary</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-model-governance-data-boundary">
                {MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_LEAD}{" "}
                <Link className={OPERATOR_LINK.inline} href={MODEL_GOVERNANCE_HELP_SUBPROCESSORS_HREF}>
                  Subprocessors register
                </Link>{" "}
                lists disclosed external engines. {MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_EMBEDDINGS}{" "}
                <Link className={OPERATOR_LINK.inline} href={MODEL_GOVERNANCE_HELP_DATA_HANDLING_HREF}>
                  Data handling help
                </Link>{" "}
                covers residency and retention posture.
              </p>
            </section>

            <section
              aria-labelledby="what-model-governance-controls"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-model-governance-controls">What model approval controls</HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-model-governance-feature-items"
              >
                {MODEL_GOVERNANCE_HELP_FEATURE_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-al-text-primary">
                      {item.href === undefined ? (
                        item.label
                      ) : (
                        <Link className={OPERATOR_LINK.nav} href={item.href}>
                          {item.label}
                        </Link>
                      )}
                    </dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="how-model-governance-works"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-model-governance-works">{MODEL_GOVERNANCE_HELP_TOPIC_LABEL}</HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-model-governance-how-stepper"
              >
                {MODEL_GOVERNANCE_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

          {buyerPolishedShell ? null : <HelpTopicTableOfContents headings={guideHeadings} />}
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-model-governance-orientation-bottom">
            <HelpModelGovernanceSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
