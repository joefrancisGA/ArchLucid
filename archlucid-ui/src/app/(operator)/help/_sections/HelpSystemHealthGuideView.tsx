import Link from "next/link";

import { HelpSystemHealthHeaderActions } from "@/app/(operator)/help/_sections/HelpSystemHealthHeaderActions";
import { HelpSystemHealthSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpSystemHealthSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SystemHealthHelpClaimDisciplineStrip } from "@/components/help/SystemHealthHelpClaimDisciplineStrip";
import { SystemHealthHelpEvidenceOrientationStrip } from "@/components/help/SystemHealthHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_CANONICAL_PATH,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
} from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE,
  SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
  SYSTEM_HEALTH_HELP_GUIDE_HEADINGS,
  SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS,
  SYSTEM_HEALTH_HELP_OVERVIEW,
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE,
  SYSTEM_HEALTH_HELP_PAGE_TITLE,
  SYSTEM_HEALTH_HELP_PRIMARY_ACTION,
  SYSTEM_HEALTH_HELP_READINESS_HELPER,
  SYSTEM_HEALTH_HELP_TILE_ITEMS,
} from "@/lib/system-health-help-guide-content";
import {
  SYSTEM_HEALTH_HELP_BUYER_OVERVIEW,
  SYSTEM_HEALTH_HELP_FIRST_VIEWPORT_TEST_ID,
  SYSTEM_HEALTH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SYSTEM_HEALTH_HELP_PAGE_LEAD,
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE_BUYER,
  SYSTEM_HEALTH_HELP_PRIMARY_CONTENT_ID,
  SYSTEM_HEALTH_HELP_SKIP_LINK_LABEL,
  SYSTEM_HEALTH_HELP_SKIP_TARGET_ID,
  SYSTEM_HEALTH_HELP_START_HERE_HELPER,
  SYSTEM_HEALTH_HELP_WORKSPACE_TEST_ID,
} from "@/lib/system-health-help-page-copy";
import { cn } from "@/lib/utils";

type HelpSystemHealthGuideViewProps = {
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

function systemHealthHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SYSTEM_HEALTH_HELP_PAGE_SUBTITLE_BUYER : SYSTEM_HEALTH_HELP_PAGE_SUBTITLE;
}

function SystemHealthStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-system-health-action-panel"
      aria-labelledby="help-system-health-action-panel-heading"
    >
      <h2
        id="help-system-health-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Start here
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild data-testid="help-system-health-primary-cta" size="sm" variant="primary">
          <Link href={SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href}>{SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label}</Link>
        </Button>
      </div>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-system-health-readiness-helper"
      >
        {SYSTEM_HEALTH_HELP_READINESS_HELPER}
      </p>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-system-health-start-here-helper"
      >
        {SYSTEM_HEALTH_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

/** Operator system health orientation for `/help/system-health`. */
export function HelpSystemHealthGuideView(props: HelpSystemHealthGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-system-health",
    SYSTEM_HEALTH_HELP_GUIDE_HEADINGS,
    SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
  );
  const showSectionNav = !buyerPolishedShell && guideHeadings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? guideHeadings.length : 0);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const pageBody = (
    <>
      <HelpTopicGuidePageHeader
        title={SYSTEM_HEALTH_HELP_PAGE_TITLE}
        titleTestId="help-system-health-page-title"
        subtitle={systemHealthHelpPageSubtitle(buyerPolishedShell)}
        subtitleClassName="max-w-3xl"
        navHref={SYSTEM_HEALTH_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          buyerPolishedShell ? undefined : (
            <HelpTopicBreadcrumb topicTitle={SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE} />
          )
        }
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        claimDiscipline={buyerPolishedShell ? SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId={
          buyerPolishedShell ? SYSTEM_HEALTH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
        }
        actions={buyerPolishedShell ? undefined : <HelpSystemHealthHeaderActions />}
      />

      {buyerPolishedShell ? null : <SystemHealthHelpClaimDisciplineStrip />}

      {buyerPolishedShell ? (
        <div
          id={SYSTEM_HEALTH_HELP_SKIP_TARGET_ID}
          data-testid={SYSTEM_HEALTH_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <div className="space-y-4" data-testid="help-system-health-buyer-intro">
            <p className={cn(readingBodyClass, "max-w-3xl")} data-testid="help-system-health-intro">
              {SYSTEM_HEALTH_HELP_PAGE_LEAD}
            </p>
          </div>
          <SystemHealthStartHerePanel />
        </div>
      ) : null}

      {buyerPolishedShell ? (
        <p className={readingBodyClass} data-testid="help-system-health-overview">
          {SYSTEM_HEALTH_HELP_BUYER_OVERVIEW}
        </p>
      ) : null}

      <section
        className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
        data-testid={buyerPolishedShell ? SYSTEM_HEALTH_HELP_WORKSPACE_TEST_ID : undefined}
      >
        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          {buyerPolishedShell ? null : <SystemHealthHelpEvidenceOrientationStrip />}

          {!buyerPolishedShell ? (
            <p className={readingBodyClass} data-testid="help-system-health-overview">
              {SYSTEM_HEALTH_HELP_OVERVIEW}
            </p>
          ) : null}

          {!buyerPolishedShell ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-system-health-readiness-helper"
            >
              {SYSTEM_HEALTH_HELP_READINESS_HELPER}
            </p>
          ) : null}

          <section
            aria-labelledby="what-system-health-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-system-health-shows">What system health shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-system-health-tile-items"
            >
              {SYSTEM_HEALTH_HELP_TILE_ITEMS.map((item) => (
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
            aria-labelledby="how-system-health-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-system-health-works">{SYSTEM_HEALTH_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-system-health-how-stepper"
            >
              {SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={guideHeadings} /> : null}
        </div>
      </section>

      {buyerPolishedShell ? <HelpSystemHealthSourcesOrientationStrip /> : null}
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-system-health-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${SYSTEM_HEALTH_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {SYSTEM_HEALTH_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={SYSTEM_HEALTH_HELP_PRIMARY_CONTENT_ID}
          data-testid={SYSTEM_HEALTH_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {pageBody}
        </div>
      ) : (
        pageBody
      )}
    </article>
  );
}
