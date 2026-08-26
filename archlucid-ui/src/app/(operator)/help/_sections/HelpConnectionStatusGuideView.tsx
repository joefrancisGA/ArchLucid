import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpConnectionStatusHeaderActions } from "@/app/(operator)/help/_sections/HelpConnectionStatusHeaderActions";
import { HelpConnectionStatusWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip";
import { ConnectionStatusHelpClaimDisciplineStrip } from "@/components/help/ConnectionStatusHelpClaimDisciplineStrip";
import { ConnectionStatusHelpEvidenceOrientationStrip } from "@/components/help/ConnectionStatusHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import {
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
  CONNECTION_STATUS_HELP_STATUS_LEGEND_HEADING,
  CONNECTION_STATUS_HELP_STATUS_LEGEND_INTRO,
  CONNECTION_STATUS_HELP_SURFACE_ITEMS,
} from "@/lib/connection-status-help-guide-content";
import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import { CONNECTION_STATUS_HELP_STATUS_LEGEND } from "@/lib/connection-status-help-status-legend";
import { resolveConnectorDisplayStatusTag } from "@/lib/connector-operations-present";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-connection-status-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CONNECTION_STATUS_HELP_PAGE_TITLE}
        titleTestId="help-connection-status-page-title"
        subtitle={CONNECTION_STATUS_HELP_PAGE_SUBTITLE}
        navHref={CONNECTION_STATUS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpConnectionStatusHeaderActions />}
      />

      <ConnectionStatusHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "max-w-[75ch] space-y-6 xl:max-w-none")}>
          <ConnectionStatusHelpEvidenceOrientationStrip />

          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-connection-status-overview"
          >
            {CONNECTION_STATUS_HELP_OVERVIEW}
          </p>

          <HelpConnectionStatusWorkspaceReadinessStrip />

          <section
            aria-labelledby="what-connection-status-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-connection-status-shows">What connection status shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-connection-status-surface-items"
            >
              {CONNECTION_STATUS_HELP_SURFACE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="connection-status-status-tags"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="connection-status-status-tags">
              {CONNECTION_STATUS_HELP_STATUS_LEGEND_HEADING}
            </HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CONNECTION_STATUS_HELP_STATUS_LEGEND_INTRO}</p>
            <ul
              className="m-0 list-none space-y-3 p-0"
              data-testid="help-connection-status-status-legend"
            >
              {CONNECTION_STATUS_HELP_STATUS_LEGEND.map((row) => {
                const tag = resolveConnectorDisplayStatusTag(row.status);

                return (
                  <li
                    key={row.status}
                    className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusTag kind={tag.kind} label={tag.label} />
                      <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {row.meaning}
                      </span>
                    </div>
                    <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Next: {row.nextAction}
                    </p>
                  </li>
                );
              })}
            </ul>
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
        </div>

        <HelpTopicTableOfContents headings={CONNECTION_STATUS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
