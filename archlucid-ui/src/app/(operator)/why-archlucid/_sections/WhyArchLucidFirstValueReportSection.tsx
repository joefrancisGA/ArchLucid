import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";

import type { WhyArchLucidDemoUniverse } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";

import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";

import { WHY_ARCHLUCID_SECTION_SHELL_CLASS } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-section-shell";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";



export type WhyArchLucidFirstValueReportSectionProps = {

  readonly state: WhyArchLucidPageState;

  readonly universe: WhyArchLucidDemoUniverse;

};



function firstValueReportHelperLead(universe: WhyArchLucidDemoUniverse): string {

  switch (universe) {

    case "claims":

      return "Sponsor-facing markdown generated from the committed Claims Intake demo review.";

    case "contoso":

      return "Sponsor-facing markdown generated from the committed Retail baseline demo review.";

    case "unknown":

      return "Sponsor-facing markdown generated from the committed demo review when available.";

    default: {

      const _exhaustive: never = universe;



      return _exhaustive;

    }

  }

}



function firstValueReportMissingLead(universe: WhyArchLucidDemoUniverse): string {

  switch (universe) {

    case "claims":

      return "The demo review has not been committed yet — seed the Claims Intake sample workspace and refresh.";

    case "contoso":

      return "The demo review has not been committed yet — seed the Retail baseline sample workspace and refresh.";

    case "unknown":

      return "The demo review has not been committed yet — seed a consistent demo package and refresh.";

    default: {

      const _exhaustive: never = universe;



      return _exhaustive;

    }

  }

}



export function WhyArchLucidFirstValueReportSection(props: WhyArchLucidFirstValueReportSectionProps) {

  const { state, universe } = props;



  return (

    <section

      aria-labelledby="why-archlucid-report-heading"

      data-testid="why-archlucid-first-value-report"

      className={WHY_ARCHLUCID_SECTION_SHELL_CLASS}

    >

      <h2 id="why-archlucid-report-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>

        Sponsor first-value report

      </h2>

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="why-archlucid-report-helper">

        {firstValueReportHelperLead(universe)}

      </p>



      {state.reportError ? (

        <OperatorApiProblem

          problem={state.reportError.problem}

          fallbackMessage={state.reportError.message}

          correlationId={state.reportError.correlationId}

        />

      ) : null}



      {state.reportMissing ? (

        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{firstValueReportMissingLead(universe)}</p>

      ) : null}



      {state.reportMarkdown ? (

        <pre

          data-testid="why-archlucid-first-value-report-body"

          tabIndex={0}

          role="region"

          aria-label="Sponsor first-value report body"

          className={cn(

            "max-h-[480px] overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-3 text-al-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-800 dark:bg-neutral-900",

            OPERATOR_TYPOGRAPHY.body,

          )}

        >

          {state.reportMarkdown}

        </pre>

      ) : null}

    </section>

  );

}

