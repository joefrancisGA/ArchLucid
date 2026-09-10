import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_CANONICAL_PATH,
  ARCHITECTURE_SHARE_RESTRICT_HELP_TOPIC_LABEL,
} from "@/lib/architecture/architecture-share-restrict-help-evidence-copy";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION,
  ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES,
} from "@/lib/architecture/architecture-share-restrict-help-guide-content";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_TEST_ID,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_CONTENT_ID,
} from "@/lib/architecture/architecture-share-restrict-help-page-copy";
import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpArchitectureShareRestrictGuideViewProps = {
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

/** Architecture share boundary for `/help/architecture-sharing` (AS-098). */
export function HelpArchitectureShareRestrictGuideView(
  props: HelpArchitectureShareRestrictGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid={ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_TEST_ID}
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE}
        titleTestId="help-architecture-sharing-page-title"
        subtitle={ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_SUBTITLE}
        navHref={ARCHITECTURE_SHARE_RESTRICT_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div
        id={ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_CONTENT_ID}
        data-testid={ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_CONTENT_ID}
        className={contentGridClass}
      >
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <p className={readingBodyClass} data-testid="help-architecture-sharing-overview">
            {ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW}
          </p>

          <section aria-labelledby="restrict-and-roles" className="space-y-4">
            <HelpSectionHeading id="restrict-and-roles">Restrict-to-shares and share roles</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-3" data-testid="help-architecture-sharing-role-tiles">
              {ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES.map((tile) => (
                <article
                  key={tile.id}
                  className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid={`help-architecture-sharing-role-tile-${tile.id.toLowerCase()}`}
                >
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{tile.label}</h3>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{tile.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="grandfather-default" className="space-y-3">
            <HelpSectionHeading id="grandfather-default">
              {ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_TITLE}
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-architecture-sharing-grandfather">
              {ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY}
            </p>
          </section>

          <section aria-labelledby="one-tenant" className="space-y-3">
            <HelpSectionHeading id="one-tenant">{ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE}</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-architecture-sharing-one-tenant">
              {ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY}
            </p>
          </section>

          <section aria-labelledby="product-boundary" className="space-y-3">
            <HelpSectionHeading id="product-boundary">{ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE}</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-architecture-sharing-boundary">
              {ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY}
            </p>
          </section>

          <section aria-labelledby="where-to-go-next" className="space-y-3">
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION.href}>
                  {ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED.href}>
                  {ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED.label}
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <aside className={HELP_PAGE_TOC.nav}>
          <HelpTopicTableOfContents headings={ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_HEADINGS} />
          <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Topic: {ARCHITECTURE_SHARE_RESTRICT_HELP_TOPIC_LABEL}
          </p>
        </aside>
      </div>
    </article>
  );
}
