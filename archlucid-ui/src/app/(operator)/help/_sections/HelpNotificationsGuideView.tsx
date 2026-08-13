import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { NotificationsHelpEvidenceOrientationStrip } from "@/components/help/NotificationsHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  NOTIFICATIONS_HELP_ALERTS_HREF,
  NOTIFICATIONS_HELP_GUIDE_HEADINGS,
  NOTIFICATIONS_HELP_HOW_TO_READ_STEPS,
  NOTIFICATIONS_HELP_OVERVIEW,
  NOTIFICATIONS_HELP_PAGE_SUBTITLE,
  NOTIFICATIONS_HELP_PAGE_TITLE,
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
  NOTIFICATIONS_HELP_SLACK_INTEGRATION_HREF,
  NOTIFICATIONS_HELP_TILE_ITEMS,
} from "@/lib/notifications-help-guide-content";
import { NOTIFICATIONS_HELP_CANONICAL_PATH } from "@/lib/notifications-help-evidence-copy";
import { NOTIFICATIONS_HELP_TOPIC_LABEL } from "@/lib/notification-preference-center";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
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

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-notifications-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={NOTIFICATIONS_HELP_PAGE_TITLE}
        titleTestId="help-notifications-page-title"
        subtitle={NOTIFICATIONS_HELP_PAGE_SUBTITLE}
        navHref={NOTIFICATIONS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-notifications-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: NOTIFICATIONS_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-notifications-overview">
            {NOTIFICATIONS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-notifications-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open notifications</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={NOTIFICATIONS_HELP_PRIMARY_ACTION.href}>{NOTIFICATIONS_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-notifications-cover"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-notifications-cover">What notifications cover</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-notifications-tile-items"
            >
              {NOTIFICATIONS_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
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
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-notifications-how-stepper"
            >
              {NOTIFICATIONS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={NOTIFICATIONS_HELP_ALERTS_HREF}>
                Read alerts help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={NOTIFICATIONS_HELP_SLACK_INTEGRATION_HREF}>
                Read Slack integration help →
              </Link>
            </p>
          </section>

          <NotificationsHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={NOTIFICATIONS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
