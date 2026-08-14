import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ApiKeysHelpEvidenceOrientationStrip } from "@/components/help/ApiKeysHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  API_KEYS_HELP_ACTION_PANEL_ID,
  API_KEYS_HELP_ACTION_PANEL_INTRO,
  API_KEYS_HELP_ACTION_PANEL_TITLE,
  API_KEYS_HELP_FEATURE_ITEMS,
  API_KEYS_HELP_GUIDE_HEADINGS,
  API_KEYS_HELP_HOW_TO_READ_STEPS,
  API_KEYS_HELP_INSTEAD_SECTION_ID,
  API_KEYS_HELP_INSTEAD_SECTION_TITLE,
  API_KEYS_HELP_OVERVIEW,
  API_KEYS_HELP_PAGE_SUBTITLE,
  API_KEYS_HELP_PAGE_TITLE,
  API_KEYS_HELP_PRIMARY_ACTIONS,
  API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE,
  API_KEYS_HELP_RELEASE_STATUS_LABEL,
  type ApiKeysHelpPrimaryAction,
} from "@/lib/api-keys-help-guide-content";
import { API_KEYS_HELP_CANONICAL_PATH } from "@/lib/api-keys-help-evidence-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpApiKeysGuideViewProps = {
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

function HelpApiKeysPrimaryActionButton(props: { readonly action: ApiKeysHelpPrimaryAction }): React.ReactElement {
  const { action } = props;

  return (
    <Button asChild size="sm" variant={action.variant}>
      <Link href={action.href}>{action.label}</Link>
    </Button>
  );
}

/** Operator API keys orientation for `/help/api-keys`. */
export function HelpApiKeysGuideView(_props: HelpApiKeysGuideViewProps): React.ReactElement {
  const contentGridClass = resolveHelpPageContentGridClass(API_KEYS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")} data-testid="help-api-keys-guide">
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={API_KEYS_HELP_PAGE_TITLE}
        titleTestId="help-api-keys-page-title"
        subtitle={API_KEYS_HELP_PAGE_SUBTITLE}
        navHref={API_KEYS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        statusBadge={<StatusTag kind="neutral" label={API_KEYS_HELP_RELEASE_STATUS_LABEL} />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-api-keys-overview">
            {API_KEYS_HELP_OVERVIEW}
          </p>

          <Card
            id={API_KEYS_HELP_ACTION_PANEL_ID}
            className={cn(
              DESIGN_TOKENS.surface.card,
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "scroll-mt-24",
            )}
            data-testid="help-api-keys-action-panel"
          >
            <CardHeader className={cn(OPERATOR_CARD.header, "space-y-2")}>
              <h2 className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {API_KEYS_HELP_ACTION_PANEL_TITLE}
              </h2>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>
                {API_KEYS_HELP_ACTION_PANEL_INTRO}
              </p>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
              <div className="space-y-2">
                <StatusTag kind="neutral" label={API_KEYS_HELP_RELEASE_STATUS_LABEL} />
                <p className={cn("m-0 max-w-3xl", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-api-keys-availability-note">
                  {API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <HelpApiKeysPrimaryActionButton action={API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles} />
                <HelpApiKeysPrimaryActionButton action={API_KEYS_HELP_PRIMARY_ACTIONS.cliUsageHelp} />
                <HelpApiKeysPrimaryActionButton action={API_KEYS_HELP_PRIMARY_ACTIONS.audit} />
              </div>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-api-keys-are-for"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-api-keys-are-for">What API keys are for</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-api-keys-feature-items"
            >
              {API_KEYS_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby={API_KEYS_HELP_INSTEAD_SECTION_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id={API_KEYS_HELP_INSTEAD_SECTION_ID}>
              {API_KEYS_HELP_INSTEAD_SECTION_TITLE}
            </HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-api-keys-how-stepper"
            >
              {API_KEYS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <ApiKeysHelpEvidenceOrientationStrip />
          </div>
        </div>

        <HelpTopicTableOfContents headings={API_KEYS_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
