import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CORE_PILOT_HELP_CLOUD_ACTIONS,
  CORE_PILOT_HELP_DEFERRED_ITEMS,
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_OPTIONAL_PATHS_SUMMARY,
  CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
} from "@/lib/core-pilot-help-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

function PostStepperSectionHeading(props: { readonly id: string; readonly children: string }): React.JSX.Element {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 mt-10 first:mt-0")}
    >
      {props.children}
    </h2>
  );
}

/** TB-1334: one optional cluster after the stepper instead of four peer orientation sections. */
export function CorePilotHelpPostStepperPanel(): React.JSX.Element {
  return (
    <>
      <section aria-labelledby="optional-paths" className="space-y-3" data-testid="core-pilot-optional-paths">
        <PostStepperSectionHeading id="optional-paths">{CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE}</PostStepperSectionHeading>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CORE_PILOT_HELP_OPTIONAL_PATHS_SUMMARY}</p>
        <details className={HELP_PAGE_LAYOUT.details} data-testid="core-pilot-optional-paths-disclosure">
          <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Show optional cloud, evidence-only, and later topics
          </summary>
          <div className={cn(HELP_PAGE_LAYOUT.detailsBody, "space-y-6")}>
            <div className="space-y-3" data-testid="core-pilot-cloud-actions">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Cloud connectors</h3>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                {CORE_PILOT_HELP_DISCLOSURE.whenToUseCloudConnectors.body}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CORE_PILOT_HELP_CLOUD_ACTIONS.map((action) => (
                  <Card key={action.title} className="h-full">
                    <CardHeader className={OPERATOR_CARD.header}>
                      <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{action.title}</CardTitle>
                      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{action.description}</p>
                    </CardHeader>
                    <CardContent className={OPERATOR_CARD.content}>
                      <Button asChild size="sm" variant="outline">
                        <Link href={action.href}>{action.ctaLabel}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3" data-testid="core-pilot-fast-path-panel">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Fast path: evidence-only review</h3>
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardContent className={cn(OPERATOR_CARD.body, "space-y-3")}>
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                    Recommended when connector access is not approved yet, or when your first session only has briefs,
                    diagrams, IaC, screenshots, exports, or policy documents.
                  </p>
                  <ol className={cn("m-0 list-decimal space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                    <li>Start a review with no cloud target selected (evidence-only).</li>
                    <li>Upload files or paste your architecture brief — a cloud connector is not required.</li>
                    <li>Start the review, finalize the package, and export the sponsor briefing.</li>
                  </ol>
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                    <Link href="#first-review-path" className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)}>
                      Start evidence-only review
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3" data-testid="core-pilot-deferred-topics-panel">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>What can wait</h3>
              <ul className="m-0 list-none space-y-3 p-0">
                {CORE_PILOT_HELP_DEFERRED_ITEMS.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
                  >
                    <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>{item.title}</p>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{item.description}</p>
                  </li>
                ))}
              </ul>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                {CORE_PILOT_HELP_DISCLOSURE.whatCanWaitUntilLater.body}
              </p>
            </div>
          </div>
        </details>
      </section>

      <section
        aria-labelledby="ready-to-begin"
        className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50/80 p-6 dark:border-neutral-800 dark:bg-neutral-900/30"
        data-testid="core-pilot-closing-cta"
      >
        <h2 id="ready-to-begin" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Ready to begin?
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
          Start your first review now, or explore the sample review to see a completed outcome.
        </p>
        <p className={cn("m-0 mt-4 flex flex-wrap gap-x-4 gap-y-2", OPERATOR_TYPOGRAPHY.body)}>
          <Link href="#first-review-path" className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)}>
            Jump to start control
          </Link>
          <Link
            href={CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href}
            className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)}
          >
            {CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label}
          </Link>
        </p>
      </section>
    </>
  );
}
