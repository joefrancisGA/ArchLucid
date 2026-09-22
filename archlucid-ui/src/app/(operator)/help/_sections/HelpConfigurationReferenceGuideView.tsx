import Link from "next/link";

import { HelpConfigurationReferenceActionPanel } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceActionPanel";
import { HelpConfigurationReferenceCatalogSection } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceCatalogSection";
import { HelpConfigurationReferenceProvenanceFooter } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceProvenanceFooter";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ConfigurationReferenceHelpClaimDisciplineStrip } from "@/components/help/ConfigurationReferenceHelpClaimDisciplineStrip";
import { HelpConfigurationReferenceBreadcrumb } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CONFIGURATION_REFERENCE_HELP_GUIDE_HEADINGS,
  CONFIGURATION_REFERENCE_HELP_OVERVIEW,
  CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
  CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
  CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS,
} from "@/lib/configuration-reference-help-guide-content";
import {
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/configuration-reference-help-ia-dual";
import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpConfigurationReferenceGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function taskSectionId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        OPERATOR_TYPOGRAPHY.sectionTitle,
        "m-0 scroll-mt-24",
      )}
    >
      {props.children}
    </h2>
  );
}

function JobMatrixRow(props: {
  readonly label: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
}): React.ReactElement {
  if (props.isCurrent === true) {
    return (
      <span className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          className="font-medium text-al-text-primary"
          aria-current="page"
          data-testid="help-configuration-reference-job-matrix-current"
        >
          {props.label}
        </span>
        <StatusTag kind="ready" label="Current guide" />
      </span>
    );
  }

  if (props.href === undefined || props.href.length === 0) {
    return <span className="shrink-0 font-medium text-al-text-primary">{props.label}</span>;
  }

  return (
    <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={props.href}>
      {props.label}
    </Link>
  );
}

/** Admin configuration task orientation for `/help/configuration-reference` (TB-1326 / TB-1328). */
export function HelpConfigurationReferenceGuideView(
  props: HelpConfigurationReferenceGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const contentGridClass = resolveHelpPageContentGridClass(CONFIGURATION_REFERENCE_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-configuration-reference-guide"
    >
      <HelpTopicHashScroll />

      <HelpConfigurationReferenceBreadcrumb />

      <HelpTopicGuidePageHeader
        title={CONFIGURATION_REFERENCE_HELP_PAGE_TITLE}
        titleTestId="help-configuration-reference-page-title"
        subtitle={CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE}
        navHref={CONFIGURATION_REFERENCE_HELP_PATH}
        headingLevel="h1"
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-configuration-reference-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <ConfigurationReferenceHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "min-w-0 space-y-6")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-configuration-reference-overview">
            {CONFIGURATION_REFERENCE_HELP_OVERVIEW}
          </p>

          <HelpConfigurationReferenceActionPanel />

          <div className="space-y-4" data-testid="help-configuration-reference-task-sections">
            {CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS.map((section) => (
              <section
                key={section.title}
                id={taskSectionId(section.title)}
                aria-labelledby={`help-configuration-reference-task-${taskSectionId(section.title)}`}
                className={cn(HELP_PAGE_LAYOUT.contentPanel, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24 space-y-2")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <HelpSectionHeading id={`help-configuration-reference-task-${taskSectionId(section.title)}`}>
                    {section.title}
                  </HelpSectionHeading>
                  {section.status !== undefined ? (
                    <StatusTag kind={section.status.kind} label={section.status.label} />
                  ) : null}
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{section.body}</p>
              </section>
            ))}
          </div>

          <section
            id={CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID}
            aria-labelledby="help-configuration-reference-job-matrix-heading"
            className={cn(
              HELP_PAGE_LAYOUT.contentPanel,
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "scroll-mt-24 space-y-4",
            )}
            data-testid={CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID}
          >
            <HelpSectionHeading id="help-configuration-reference-job-matrix-heading">
              {CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING}
            </HelpSectionHeading>
            <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <JobMatrixRow label={row.label} href={row.href} isCurrent={row.isCurrent} />
                  <span className="text-al-text-secondary">{row.when}</span>
                </li>
              ))}
            </ul>
          </section>

          <HelpConfigurationReferenceCatalogSection
            entry={entry}
            markdown={markdown}
            sourceDocPath={sourceDocPath}
          />

          <HelpConfigurationReferenceProvenanceFooter entry={entry} />
        </div>

        <HelpTopicTableOfContents headings={CONFIGURATION_REFERENCE_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
