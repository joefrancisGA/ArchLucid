import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ApiKeysHelpEvidenceOrientationStrip } from "@/components/help/ApiKeysHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
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
  API_KEYS_HELP_CLI_USAGE_HREF,
  API_KEYS_HELP_FEATURE_ITEMS,
  API_KEYS_HELP_GUIDE_HEADINGS,
  API_KEYS_HELP_HOW_TO_READ_STEPS,
  API_KEYS_HELP_OVERVIEW,
  API_KEYS_HELP_PAGE_SUBTITLE,
  API_KEYS_HELP_PAGE_TITLE,
  API_KEYS_HELP_PRIMARY_ACTION,
  API_KEYS_HELP_USERS_HREF,
} from "@/lib/api-keys-help-guide-content";
import { API_KEYS_HELP_CANONICAL_PATH } from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
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

/** Operator API keys orientation for `/help/api-keys`. */
export function HelpApiKeysGuideView(props: HelpApiKeysGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(API_KEYS_HELP_GUIDE_HEADINGS.length);

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")} data-testid="help-api-keys-guide">
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={API_KEYS_HELP_PAGE_TITLE}
        titleTestId="help-api-keys-page-title"
        subtitle={API_KEYS_HELP_PAGE_SUBTITLE}
        navHref={API_KEYS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-api-keys-overview">
            {API_KEYS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-api-keys-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open API keys</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={API_KEYS_HELP_PRIMARY_ACTION.href}>{API_KEYS_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-api-keys-are-for"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-api-keys-are-for">What API keys are for</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
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
            aria-labelledby="how-api-keys-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-api-keys-work">{API_KEYS_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-api-keys-how-stepper"
            >
              {API_KEYS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={API_KEYS_HELP_CLI_USAGE_HREF}>
                Read CLI usage help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={API_KEYS_HELP_USERS_HREF}>
                Read users and roles help →
              </Link>
            </p>
          </section>

          <ApiKeysHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={API_KEYS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
