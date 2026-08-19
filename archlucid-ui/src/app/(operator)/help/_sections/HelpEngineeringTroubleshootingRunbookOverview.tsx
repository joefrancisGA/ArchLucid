import { CollapsibleSection } from "@/components/CollapsibleSection";

import {

  ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW,

  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,

  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO,

  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE,

} from "@/lib/engineering-troubleshooting-help-guide-content";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

import { humanizeMarkdownFileReference } from "@/lib/help/help-markdown-presentation";

import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

import { cn } from "@/lib/utils";



type HelpEngineeringTroubleshootingRunbookOverviewProps = {

  readonly majorSections: readonly HelpMarkdownHeading[];

  readonly entry: ProductDocumentationEntry;

};



/** Runbook overview landing for the engineering troubleshooting help topic (HDX). */

export function HelpEngineeringTroubleshootingRunbookOverview(

  props: HelpEngineeringTroubleshootingRunbookOverviewProps,

): React.ReactElement {

  return (

    <section

      aria-labelledby="help-engineering-troubleshooting-runbook-overview-heading"

      className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"

      data-testid="help-engineering-troubleshooting-runbook-overview"

    >

      <div className="space-y-1">

        <h2

          id="help-engineering-troubleshooting-runbook-overview-heading"

          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}

        >

          {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.title}

        </h2>

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW}</p>

      </div>



      <dl className="m-0 grid gap-3 sm:grid-cols-2">

        <div>

          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Audience</dt>

          <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>

            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.audience}

          </dd>

        </div>

        <div>

          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Support status</dt>

          <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>

            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.stability}

          </dd>

        </div>

        <div className="sm:col-span-2">

          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Authoritative source</dt>

          <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>

            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.documentTitle}

          </dd>

        </div>

      </dl>



      <CollapsibleSection

        title={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE}

        summaryLine={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO}

        sectionTestId="help-engineering-troubleshooting-runbook-source-paths"

      >

        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>

          {props.entry.sourcePaths.map((sourcePath) => (

            <li key={sourcePath}>{humanizeMarkdownFileReference(sourcePath)}</li>

          ))}

        </ul>

      </CollapsibleSection>

    </section>

  );

}

