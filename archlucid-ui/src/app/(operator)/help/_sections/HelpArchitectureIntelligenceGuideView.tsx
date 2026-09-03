import Link from "next/link";

import { HelpArchitectureIntelligenceClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceClaimOrientationStrip";
import { HelpArchitectureIntelligenceHeaderActions } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE,
  ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS,
  ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS,
  ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_SCOPE_NOTE,
} from "@/lib/architecture-intelligence-help-guide-content";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID,
} from "@/lib/architecture-intelligence-help-page-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpArchitectureIntelligenceGuideViewProps = {
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

/** Operator architecture intelligence orientation for `/help/architecture-intelligence`. */
export function HelpArchitectureIntelligenceGuideView(
  props: HelpArchitectureIntelligenceGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-architecture-intelligence",
    ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS,
    ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-architecture-intelligence-guide"
    >
      <a href={`#${ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID}
        data-testid={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE}
          titleTestId="help-architecture-intelligence-page-title"
          subtitle={ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE}
          navHref={ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={ARCHITECTURE_INTELLIGENCE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpArchitectureIntelligenceHeaderActions entry={entry} />}
        />

        <div
          id={ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID}
          data-testid={ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-architecture-intelligence-overview">
            {ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW}
          </p>

          <HelpTopicRegistryProvenanceLine entry={entry} />

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-architecture-intelligence-action-panel"
            aria-labelledby="help-architecture-intelligence-action-panel-heading"
          >
            <h2
              id="help-architecture-intelligence-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE}
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link href={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href}>
                {ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-architecture-intelligence-start-here-scope-note"
            >
              {ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_SCOPE_NOTE}
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-architecture-intelligence-data-handling"
            >
              {ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE}{" "}
              <Link className={OPERATOR_LINK.nav} href={ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK.href}>
                {ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK.label}
              </Link>
              .
            </p>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            <section
              aria-labelledby="what-architecture-intelligence-does"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-architecture-intelligence-does">
                What architecture intelligence does
              </HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-architecture-intelligence-feature-items"
              >
                {ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-al-text-primary">
                      <Link className={OPERATOR_LINK.nav} href={item.href}>
                        {item.label}
                      </Link>
                    </dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="how-architecture-intelligence-works"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-architecture-intelligence-works">
                {ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL}
              </HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-architecture-intelligence-how-stepper"
              >
                {ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

          <HelpTopicTableOfContents headings={guideHeadings} />
        </div>

        <div data-testid="help-architecture-intelligence-orientation-bottom">
          <HelpArchitectureIntelligenceClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
