import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { PreferencesHelpEvidenceOrientationStrip } from "@/components/help/PreferencesHelpEvidenceOrientationStrip";
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
  PREFERENCES_HELP_GETTING_STARTED_HREF,
  PREFERENCES_HELP_GUIDE_HEADINGS,
  PREFERENCES_HELP_HOW_TO_READ_STEPS,
  PREFERENCES_HELP_OVERVIEW,
  PREFERENCES_HELP_PAGE_SUBTITLE,
  PREFERENCES_HELP_PAGE_TITLE,
  PREFERENCES_HELP_PRIMARY_ACTION,
  PREFERENCES_HELP_SIGN_IN_METHODS_HREF,
  PREFERENCES_HELP_TILE_ITEMS,
} from "@/lib/preferences-help-guide-content";
import { PREFERENCES_HELP_CANONICAL_PATH } from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPreferencesGuideViewProps = {
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

/** Operator preferences orientation for `/help/preferences`. */
export function HelpPreferencesGuideView(props: HelpPreferencesGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(PREFERENCES_HELP_GUIDE_HEADINGS.length);

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")} data-testid="help-preferences-guide">
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PREFERENCES_HELP_PAGE_TITLE}
        titleTestId="help-preferences-page-title"
        subtitle={PREFERENCES_HELP_PAGE_SUBTITLE}
        navHref={PREFERENCES_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-preferences-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: PREFERENCES_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-preferences-overview">
            {PREFERENCES_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-preferences-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open preferences</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={PREFERENCES_HELP_PRIMARY_ACTION.href}>{PREFERENCES_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-preferences-cover"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-preferences-cover">What preferences cover</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-preferences-tile-items"
            >
              {PREFERENCES_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-preferences-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-preferences-work">{PREFERENCES_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-preferences-how-stepper"
            >
              {PREFERENCES_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={PREFERENCES_HELP_GETTING_STARTED_HREF}>
                Read getting started help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={PREFERENCES_HELP_SIGN_IN_METHODS_HREF}>
                Read sign-in methods help →
              </Link>
            </p>
          </section>

          <PreferencesHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={PREFERENCES_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
