import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { WorkspaceSettingsHelpEvidenceOrientationStrip } from "@/components/help/WorkspaceSettingsHelpEvidenceOrientationStrip";
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
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_TAG,
  WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
  WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS,
  WORKSPACE_SETTINGS_HELP_HOW_TO_READ_STEPS,
  WORKSPACE_SETTINGS_HELP_OVERVIEW,
  WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE,
  WORKSPACE_SETTINGS_HELP_PAGE_TITLE,
  WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION,
  WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE,
  WORKSPACE_SETTINGS_HELP_TILE_ITEMS,
} from "@/lib/workspace-settings-help-guide-content";
import { WORKSPACE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/workspace-settings-help-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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
  const contentGridClass = resolveHelpPageContentGridClass(WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-workspace-settings-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        topicTitle={WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE}
        title={WORKSPACE_SETTINGS_HELP_PAGE_TITLE}
        titleTestId="help-workspace-settings-page-title"
        subtitle={WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE}
        navHref={WORKSPACE_SETTINGS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-workspace-settings-overview">
            {WORKSPACE_SETTINGS_HELP_OVERVIEW}
          </p>

          <Card
            className="border-neutral-200 dark:border-neutral-800"
            data-testid="help-workspace-settings-action-panel"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.href}>
                    {WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_TAG}
                  data-testid="help-workspace-settings-admin-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-workspace-settings-admin-precondition"
              >
                {WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION}
              </p>
            </CardContent>
          </Card>

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

          <WorkspaceSettingsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
