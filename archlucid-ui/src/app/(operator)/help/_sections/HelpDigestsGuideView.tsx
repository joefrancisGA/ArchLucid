import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { DigestsHelpEvidenceOrientationStrip } from "@/components/help/DigestsHelpEvidenceOrientationStrip";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DIGESTS_HELP_CONTENT_ITEMS,
  DIGESTS_HELP_CONTENT_SECTION_TITLE,
  DIGESTS_HELP_DESTINATION_CARDS,
  DIGESTS_HELP_GUIDE_HEADINGS,
  DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS,
  DIGESTS_HELP_OVERVIEW,
  DIGESTS_HELP_PAGE_SUBTITLE,
  DIGESTS_HELP_PAGE_TITLE,
  DIGESTS_HELP_PRIMARY_ACTION,
  DIGESTS_HELP_SAMPLE_DIGEST_BROWSE_LABEL,
  DIGESTS_HELP_SAMPLE_DIGEST_LINES,
  DIGESTS_HELP_SAMPLE_DIGEST_PERIOD,
  DIGESTS_HELP_SAMPLE_DIGEST_TITLE,
} from "@/lib/digests-help-guide-content";
import {
  DIGESTS_HELP_CANONICAL_PATH,
  DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK,
  DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_NOTE,
  DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS,
  DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS_TITLE,
} from "@/lib/digests-help-evidence-copy";
import { DIGESTS_BROWSE_TAB_PATH } from "@/lib/digests-route-paths";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpDigestsGuideViewProps = {
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

function HowDigestsWorkSteps(): React.ReactElement {
  return (
    <ol
      className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="help-digests-how-stepper"
    >
      {DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS.map((step, index) => (
        <li key={step} className="flex min-w-0 gap-3">
          <span className="sr-only">{`Step ${index + 1}`}</span>
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
          >
            {index + 1}
          </span>
          <p className={cn("m-0 min-w-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

function DigestsHelpContentSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="what-a-digest-contains"
      className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
    >
      <HelpSectionHeading id="what-a-digest-contains">{DIGESTS_HELP_CONTENT_SECTION_TITLE}</HelpSectionHeading>
      <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-digests-content-items">
        {DIGESTS_HELP_CONTENT_ITEMS.map((item) => (
          <li key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-medium text-al-text-primary">{item.label}</span>
            <span className="text-al-text-secondary">
              {"from "}
              <Link className={OPERATOR_LINK.inline} href={item.href}>
                {item.sourceSurface}
              </Link>
            </span>
          </li>
        ))}
      </ul>
      <div className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")} data-testid="help-digests-sample">
        <div>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{DIGESTS_HELP_SAMPLE_DIGEST_TITLE}</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{DIGESTS_HELP_SAMPLE_DIGEST_PERIOD}</p>
        </div>
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {DIGESTS_HELP_SAMPLE_DIGEST_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <Button asChild size="sm" variant="outline">
          <Link href={DIGESTS_BROWSE_TAB_PATH}>{DIGESTS_HELP_SAMPLE_DIGEST_BROWSE_LABEL}</Link>
        </Button>
      </div>
    </section>
  );
}

function DigestsHelpSubscriptionConstraintsBlock(): React.ReactElement {
  return (
    <div
      className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
      data-testid="help-digests-subscription-constraints"
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS_TITLE}</h3>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS.map((constraint) => (
          <div key={constraint.label}>
            <dt className="font-medium text-al-text-primary">{constraint.label}</dt>
            <dd className="m-0 mt-1 text-al-text-secondary">{constraint.detail}</dd>
          </div>
        ))}
      </dl>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        {DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_NOTE}{" "}
        <Link className={OPERATOR_LINK.inline} href={DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK.href}>
          {DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK.label}
        </Link>
        {" shows who changed a destination."}
      </p>
    </div>
  );
}

/** Operator Digests orientation for `/help/digests` (TB-2049). */
export function HelpDigestsGuideView(props: HelpDigestsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(DIGESTS_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-digests-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={DIGESTS_HELP_PAGE_TITLE}
        titleTestId="help-digests-page-title"
        subtitle={DIGESTS_HELP_PAGE_SUBTITLE}
        navHref={DIGESTS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-digests-overview">
            {DIGESTS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-digests-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Manage digests</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={DIGESTS_HELP_PRIMARY_ACTION.href}>{DIGESTS_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <DigestsHelpContentSection />

          <section
            aria-labelledby="how-digests-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-digests-work">How digests work</HelpSectionHeading>
            <HowDigestsWorkSteps />
          </section>

          <section
            aria-labelledby="where-digests-are-managed"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-digests-are-managed">Where digests are managed</HelpSectionHeading>
            <div className="grid items-stretch gap-3 sm:grid-cols-3" data-testid="help-digests-destination-cards">
              {DIGESTS_HELP_DESTINATION_CARDS.map((card) => (
                <Card key={card.id} className="flex h-full min-w-0 flex-col border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={cn(OPERATOR_CARD.header, "flex-1")}>
                    <CardTitle as="h3" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.title}</CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{card.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild className="w-full" size="sm" variant="outline">
                      <Link href={card.href}>{card.actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DigestsHelpSubscriptionConstraintsBlock />
          </section>

          <DigestsHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={DIGESTS_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
