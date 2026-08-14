import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { NotificationsHelpEvidenceOrientationStrip } from "@/components/help/NotificationsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  NOTIFICATIONS_HELP_BREADCRUMB_TOPIC_TITLE,
  NOTIFICATIONS_HELP_GUIDE_HEADINGS,
  NOTIFICATIONS_HELP_HOW_TO_READ_STEPS,
  NOTIFICATIONS_HELP_OVERVIEW,
  NOTIFICATIONS_HELP_PAGE_SUBTITLE,
  NOTIFICATIONS_HELP_PAGE_TITLE,
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
  NOTIFICATIONS_HELP_ROLE_PRECONDITION,
  NOTIFICATIONS_HELP_ROLE_PRECONDITION_TAG,
  NOTIFICATIONS_HELP_START_HERE_CARD_TITLE,
  NOTIFICATIONS_HELP_START_HERE_HELPER,
  NOTIFICATIONS_HELP_TILE_ITEMS,
  NOTIFICATIONS_HELP_WORKED_EXAMPLES,
  NOTIFICATIONS_HELP_WORKED_EXAMPLES_TITLE,
} from "@/lib/notifications-help-guide-content";
import {
  NOTIFICATIONS_HELP_CANONICAL_PATH,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notifications-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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

/** Operator notifications orientation for `/help/notifications`. */
export function HelpNotificationsGuideView(props: HelpNotificationsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(NOTIFICATIONS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-notifications-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={NOTIFICATIONS_HELP_PAGE_TITLE}
        titleTestId="help-notifications-page-title"
        subtitle={NOTIFICATIONS_HELP_PAGE_SUBTITLE}
        navHref={NOTIFICATIONS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-notifications-overview">
            {NOTIFICATIONS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-notifications-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {NOTIFICATIONS_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={NOTIFICATIONS_HELP_PRIMARY_ACTION.href}>
                    {NOTIFICATIONS_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={NOTIFICATIONS_HELP_ROLE_PRECONDITION_TAG}
                  data-testid="help-notifications-role-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-notifications-role-precondition"
              >
                {NOTIFICATIONS_HELP_ROLE_PRECONDITION}
              </p>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-notifications-start-here-helper"
              >
                {NOTIFICATIONS_HELP_START_HERE_HELPER}
              </p>
            </CardContent>
          </Card>

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

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <NotificationsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>
        </div>

        <HelpTopicTableOfContents headings={NOTIFICATIONS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
