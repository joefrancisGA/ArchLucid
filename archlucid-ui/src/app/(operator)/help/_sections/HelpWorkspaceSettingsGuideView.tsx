"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { WorkspaceSettingsHelpClaimDisciplineStrip } from "@/components/help/WorkspaceSettingsHelpClaimDisciplineStrip";
import { WorkspaceSettingsHelpEvidenceOrientationStrip } from "@/components/help/WorkspaceSettingsHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID,
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_LABEL,
  WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_BODY,
  WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_SECTION_ID,
  WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_TITLE,
  WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
  WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS,
  WORKSPACE_SETTINGS_HELP_HOW_TO_READ_STEPS,
  WORKSPACE_SETTINGS_HELP_OVERVIEW,
  WORKSPACE_SETTINGS_HELP_PAGE_EYEBROW,
  WORKSPACE_SETTINGS_HELP_PAGE_TITLE,
  WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION,
  WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID,
  WORKSPACE_SETTINGS_HELP_SKIP_LINK_LABEL,
  WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE,
  WORKSPACE_SETTINGS_HELP_TILE_ITEMS,
  WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE,
  WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_SECTION_ID,
  WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_TITLE,
  workspaceSettingsHelpPageSubtitle,
} from "@/lib/workspace-settings-help-guide-content";
import { WORKSPACE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/workspace-settings-help-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpWorkspaceSettingsGuideViewProps = {
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

/** Operator workspace settings orientation for `/help/workspace-settings`. */
export function HelpWorkspaceSettingsGuideView(props: HelpWorkspaceSettingsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-workspace-settings-guide"
    >
      <a
        href={`#${WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {WORKSPACE_SETTINGS_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : WORKSPACE_SETTINGS_HELP_PAGE_EYEBROW}
        title={WORKSPACE_SETTINGS_HELP_PAGE_TITLE}
        titleTestId="help-workspace-settings-page-title"
        subtitle={workspaceSettingsHelpPageSubtitle(buyerPolishedShell)}
        navHref={WORKSPACE_SETTINGS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <WorkspaceSettingsHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div
          id={WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div data-testid="help-workspace-settings-orientation-top">
            <WorkspaceSettingsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>

          <p className={readingBodyClass} data-testid="help-workspace-settings-overview">
            {WORKSPACE_SETTINGS_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-workspace-settings-action-panel"
            aria-label={WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE}
          >
            <Button asChild size="sm" variant="primary">
              <Link
                href={WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.href}
                aria-describedby={WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID}
              >
                {WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <p
              id={WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID}
              className={cn("m-0 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-workspace-settings-admin-precondition"
            >
              <span className="font-medium text-al-text-primary">{WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_LABEL}</span>{" "}
              {WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION}
            </p>
          </section>

          <section
            aria-labelledby="what-workspace-settings-cover"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-workspace-settings-cover">What workspace settings cover</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-workspace-settings-tile-items"
            >
              {WORKSPACE_SETTINGS_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-workspace-settings-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-workspace-settings-work">{WORKSPACE_SETTINGS_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-workspace-settings-how-stepper"
            >
              {WORKSPACE_SETTINGS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby={WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_SECTION_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_SECTION_ID}>
              {WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_TITLE}
            </HelpSectionHeading>
            <div
              className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
              data-testid="help-workspace-settings-worked-example"
            >
              <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}>
                <div>
                  <dt className="font-medium text-al-text-primary">Gate</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE.gateName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-al-text-primary">Before</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE.before}</dd>
                </div>
                <div>
                  <dt className="font-medium text-al-text-primary">After</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE.after}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-al-text-primary">Downstream on the next review</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">
                    {WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE.downstreamEffect}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            aria-labelledby={WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_SECTION_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_SECTION_ID}>
              {WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_TITLE}
            </HelpSectionHeading>
            <p
              className={readingBodyClass}
              data-testid="help-workspace-settings-audit-trail-effect"
            >
              {WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_BODY}
            </p>
          </section>

        </div>

        <HelpTopicTableOfContents headings={WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
