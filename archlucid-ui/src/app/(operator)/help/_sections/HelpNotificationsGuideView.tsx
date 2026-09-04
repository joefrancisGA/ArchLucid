import Link from "next/link";

import { HelpNotificationsHeaderActions } from "@/app/(operator)/help/_sections/HelpNotificationsHeaderActions";
import { HelpNotificationsSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpNotificationsSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { NotificationsHelpClaimDisciplineStrip } from "@/components/help/NotificationsHelpClaimDisciplineStrip";
import { NotificationsHelpEvidenceOrientationStrip } from "@/components/help/NotificationsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  NOTIFICATIONS_HELP_GUIDE_HEADINGS,
  NOTIFICATIONS_HELP_HOW_TO_READ_STEPS,
  NOTIFICATIONS_HELP_OVERVIEW,
  NOTIFICATIONS_HELP_PAGE_SUBTITLE,
  NOTIFICATIONS_HELP_PAGE_TITLE,
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
  NOTIFICATIONS_HELP_START_HERE_CARD_TITLE,
  NOTIFICATIONS_HELP_START_HERE_HELPER,
  NOTIFICATIONS_HELP_TILE_ITEMS,
  NOTIFICATIONS_HELP_WORKED_EXAMPLES,
  NOTIFICATIONS_HELP_WORKED_EXAMPLES_TITLE,
} from "@/lib/notifications-help-guide-content";
import {
  NOTIFICATIONS_HELP_CANONICAL_PATH,
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notifications-help-evidence-copy";
import {
  NOTIFICATIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  NOTIFICATIONS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  NOTIFICATIONS_HELP_PRIMARY_CONTENT_ID,
  NOTIFICATIONS_HELP_SKIP_LINK_LABEL,
  NOTIFICATIONS_HELP_SKIP_TARGET_ID,
} from "@/lib/notifications-help-page-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpNotificationsGuideViewProps = {
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

function NotificationsStartHereActionPanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-notifications-action-panel"
      aria-labelledby="help-notifications-action-panel-heading"
    >
      <h2
        id="help-notifications-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {NOTIFICATIONS_HELP_START_HERE_CARD_TITLE}
      </h2>
      <Button asChild size="sm" variant="primary" data-testid="help-notifications-start-here-primary-cta">
        <Link href={NOTIFICATIONS_HELP_PRIMARY_ACTION.href}>
          {NOTIFICATIONS_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-notifications-start-here-helper"
      >
        {NOTIFICATIONS_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

/** Operator notifications orientation for `/help/notifications`. */
export function HelpNotificationsGuideView(props: HelpNotificationsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(NOTIFICATIONS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-notifications-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${NOTIFICATIONS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {NOTIFICATIONS_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      <div
        id={buyerPolishedShell ? NOTIFICATIONS_HELP_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? NOTIFICATIONS_HELP_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24 space-y-6", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={NOTIFICATIONS_HELP_PAGE_TITLE}
          titleTestId="help-notifications-page-title"
          subtitle={NOTIFICATIONS_HELP_PAGE_SUBTITLE}
          navHref={NOTIFICATIONS_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={buyerPolishedShell ? NOTIFICATIONS_HELP_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={
            buyerPolishedShell ? NOTIFICATIONS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
          }
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpNotificationsHeaderActions />}
        />

        {buyerPolishedShell ? null : <NotificationsHelpClaimDisciplineStrip />}

        {buyerPolishedShell ? (
          <div
            id={NOTIFICATIONS_HELP_SKIP_TARGET_ID}
            data-testid={NOTIFICATIONS_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <NotificationsStartHereActionPanel />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {buyerPolishedShell ? null : (
              <NotificationsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            )}

            <p className={readingBodyClass} data-testid="help-notifications-overview">
              {NOTIFICATIONS_HELP_OVERVIEW}
            </p>

            {buyerPolishedShell ? null : <NotificationsStartHereActionPanel />}

            <section
              aria-labelledby="what-notifications-cover"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-notifications-cover">What notifications cover</HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-notifications-tile-items"
              >
                {NOTIFICATIONS_HELP_TILE_ITEMS.map((item) => (
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
              aria-labelledby="how-notifications-work"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-notifications-work">{NOTIFICATIONS_HELP_TOPIC_LABEL}</HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-notifications-how-stepper"
              >
                {NOTIFICATIONS_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="notification-worked-examples"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="notification-worked-examples">
                {NOTIFICATIONS_HELP_WORKED_EXAMPLES_TITLE}
              </HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-notifications-worked-examples"
              >
                {NOTIFICATIONS_HELP_WORKED_EXAMPLES.map((example) => (
                  <div key={example.scenario}>
                    <dt className="font-medium text-al-text-primary">{example.scenario}</dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{example.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {buyerPolishedShell ? null : <HelpTopicTableOfContents headings={NOTIFICATIONS_HELP_GUIDE_HEADINGS} />}
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-notifications-orientation-bottom">
            <HelpNotificationsSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
