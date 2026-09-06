import Link from "next/link";

import { HelpBaselineSettingsHeaderActions } from "@/app/(operator)/help/_sections/HelpBaselineSettingsHeaderActions";
import { HelpBaselineSettingsSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpBaselineSettingsSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { BaselineSettingsHelpClaimDisciplineStrip } from "@/components/help/BaselineSettingsHelpClaimDisciplineStrip";
import { BaselineSettingsHelpEvidenceOrientationStrip } from "@/components/help/BaselineSettingsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help/help-topic-applicability-metadata";
import {
  BASELINE_SETTINGS_HELP_ANCHOR_ITEMS,
  BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_BODY,
  BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE,
  BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID,
  BASELINE_SETTINGS_HELP_GUIDE_HEADINGS,
  BASELINE_SETTINGS_HELP_HOW_TO_READ_STEPS,
  BASELINE_SETTINGS_HELP_METHODOLOGY_HREF,
  BASELINE_SETTINGS_HELP_METHODOLOGY_LABEL,
  BASELINE_SETTINGS_HELP_OVERVIEW,
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
  BASELINE_SETTINGS_HELP_PAGE_TITLE,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
  BASELINE_SETTINGS_HELP_USED_IN_SURFACES,
} from "@/lib/baseline-settings-help-guide-content";
import {
  BASELINE_SETTINGS_HELP_CANONICAL_PATH,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID,
  BASELINE_SETTINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BASELINE_SETTINGS_HELP_PRIMARY_CONTENT_ID,
  BASELINE_SETTINGS_HELP_SKIP_LINK_LABEL,
  BASELINE_SETTINGS_HELP_SKIP_TARGET_ID,
} from "@/lib/baseline-settings-help-page-copy";
import { BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER } from "@/lib/baseline-settings-present";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpBaselineSettingsGuideViewProps = {
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

function BaselineSettingsStartHerePanel(props: { readonly buyerPolishedShell: boolean }): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-baseline-settings-action-panel"
      aria-labelledby="help-baseline-settings-action-panel-heading"
    >
      <h2
        id="help-baseline-settings-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE}
      </h2>
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="help-baseline-settings-saved-baseline-warn"
      >
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER}</p>
      </aside>
      {props.buyerPolishedShell ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-baseline-settings-buyer-start-here-helper"
        >
          {BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER}
        </p>
      ) : (
        <Button asChild size="sm" variant="primary">
          <Link href={BASELINE_SETTINGS_HELP_PRIMARY_ACTION.href}>{BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label}</Link>
        </Button>
      )}
    </section>
  );
}

/** Operator baseline settings orientation for `/help/baseline-settings`. */
export function HelpBaselineSettingsGuideView(props: HelpBaselineSettingsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-baseline-settings",
    BASELINE_SETTINGS_HELP_GUIDE_HEADINGS,
    BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID,
  );
  const tocHeadings = buyerPolishedShell
    ? guideHeadings.filter((heading) => heading.id !== "where-to-go-next")
    : guideHeadings;
  const contentGridClass = resolveHelpPageContentGridClass(tocHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const buyerProvenanceLine = formatHelpTopicApplicabilityMetadata(entry);
  const buyerHeaderMetadata =
    buyerProvenanceLine === null
      ? null
      : (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
          data-testid="help-baseline-settings-buyer-provenance"
        >
          {buyerProvenanceLine}
        </p>
      );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-baseline-settings-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${BASELINE_SETTINGS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {BASELINE_SETTINGS_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={BASELINE_SETTINGS_HELP_PRIMARY_CONTENT_ID}
        data-testid={BASELINE_SETTINGS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={BASELINE_SETTINGS_HELP_PAGE_TITLE}
            titleTestId="help-baseline-settings-page-title"
            subtitle={BASELINE_SETTINGS_HELP_PAGE_SUBTITLE}
            navHref={BASELINE_SETTINGS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={BASELINE_SETTINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            metadata={buyerHeaderMetadata}
            actions={<HelpBaselineSettingsHeaderActions />}
          />
        ) : (
          <HelpTopicGuidePageHeader
            title={BASELINE_SETTINGS_HELP_PAGE_TITLE}
            titleTestId="help-baseline-settings-page-title"
            subtitle={BASELINE_SETTINGS_HELP_PAGE_SUBTITLE}
            navHref={BASELINE_SETTINGS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
            actions={<HelpBaselineSettingsHeaderActions />}
          />
        )}

        {!buyerPolishedShell ? <BaselineSettingsHelpClaimDisciplineStrip /> : null}

        {buyerPolishedShell ? (
          <div
            id={BASELINE_SETTINGS_HELP_SKIP_TARGET_ID}
            data-testid={BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <BaselineSettingsStartHerePanel buyerPolishedShell={buyerPolishedShell} />
            <p className={readingBodyClass} data-testid="help-baseline-settings-overview">
              {BASELINE_SETTINGS_HELP_OVERVIEW}
            </p>
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? (
              <BaselineSettingsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            ) : null}

            {!buyerPolishedShell ? (
              <p className={readingBodyClass} data-testid="help-baseline-settings-overview">
                {BASELINE_SETTINGS_HELP_OVERVIEW}
              </p>
            ) : null}

            {!buyerPolishedShell ? <BaselineSettingsStartHerePanel buyerPolishedShell={buyerPolishedShell} /> : null}

            <section
              aria-labelledby="what-baseline-settings-captures"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-baseline-settings-captures">What baseline settings capture</HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-baseline-settings-anchor-items"
              >
                {BASELINE_SETTINGS_HELP_ANCHOR_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-al-text-primary">{item.label}</dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="how-baseline-settings-work"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-baseline-settings-work">How baseline settings work</HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-baseline-settings-how-stepper"
              >
                {BASELINE_SETTINGS_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
                <Link className={OPERATOR_LINK.inline} href={BASELINE_SETTINGS_HELP_METHODOLOGY_HREF}>
                  {BASELINE_SETTINGS_HELP_METHODOLOGY_LABEL} →
                </Link>
              </p>
            </section>

            <section
              aria-labelledby="baseline-vs-roi-summary"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="baseline-vs-roi-summary">{BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE}</HelpSectionHeading>
              <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-baseline-settings-baseline-vs-roi">
                {BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_BODY}
              </p>
              <ul className={cn("m-0 list-disc space-y-1 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
                {BASELINE_SETTINGS_HELP_USED_IN_SURFACES.map((surface) => (
                  <li key={surface.href}>
                    <Link className={OPERATOR_LINK.inline} href={surface.href}>
                      {surface.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <HelpTopicTableOfContents headings={tocHeadings} />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-baseline-settings-orientation-bottom">
            <HelpBaselineSettingsSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
