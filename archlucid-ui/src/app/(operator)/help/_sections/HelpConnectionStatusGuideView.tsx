import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ConnectionStatusHelpEvidenceOrientationStrip } from "@/components/help/ConnectionStatusHelpEvidenceOrientationStrip";
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
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
  CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS,
  CONNECTION_STATUS_HELP_METHODOLOGY_HREF,
  CONNECTION_STATUS_HELP_METHODOLOGY_LABEL,
  CONNECTION_STATUS_HELP_OVERVIEW,
  CONNECTION_STATUS_HELP_PAGE_SUBTITLE,
  CONNECTION_STATUS_HELP_PAGE_TITLE,
  CONNECTION_STATUS_HELP_PRIMARY_ACTION,
  CONNECTION_STATUS_HELP_TILE_ITEMS,
} from "@/lib/connection-status-help-guide-content";
import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import { cn } from "@/lib/utils";

type HelpConnectionStatusGuideViewProps = {
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

/** Operator connection status orientation for `/help/connection-status`. */
export function HelpConnectionStatusGuideView(props: HelpConnectionStatusGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(CONNECTION_STATUS_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-connection-status-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CONNECTION_STATUS_HELP_PAGE_TITLE}
        titleTestId="help-connection-status-page-title"
        subtitle={CONNECTION_STATUS_HELP_PAGE_SUBTITLE}
        navHref={CONNECTION_STATUS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-connection-status-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: CONNECTION_STATUS_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-connection-status-overview"
          >
            {CONNECTION_STATUS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-connection-status-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open connection status</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={CONNECTION_STATUS_HELP_PRIMARY_ACTION.href}>
                  {CONNECTION_STATUS_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-connection-status-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-connection-status-shows">What connection status shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-connection-status-tile-items"
            >
              {CONNECTION_STATUS_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-to-read-connection-status"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-to-read-connection-status">How connection status works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-connection-status-how-stepper"
            >
              {CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={CONNECTION_STATUS_HELP_METHODOLOGY_HREF}>
                {CONNECTION_STATUS_HELP_METHODOLOGY_LABEL} →
              </Link>
            </p>
          </section>

          <ConnectionStatusHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={CONNECTION_STATUS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
