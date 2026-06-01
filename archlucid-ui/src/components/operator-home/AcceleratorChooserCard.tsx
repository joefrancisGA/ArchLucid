import Link from "next/link";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACCELERATOR_CHOOSER_ENTRIES } from "@/lib/accelerator-chooser";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Surfaces buyer-job → starter proof pack picks after first commit (TB-114). */
export function AcceleratorChooserCard(): React.JSX.Element {
  return (
    <section aria-labelledby="accelerator-chooser-heading" data-testid="accelerator-chooser-card">
      <Card className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <CardHeader className="space-y-1">
          <h2
            id="accelerator-chooser-heading"
            className="m-0 text-sm font-semibold text-al-text-primary tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            Pick a starter proof pack
          </h2>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            After your first committed review, choose a buyer job — each row maps to an existing pack in the repo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <OperatorHomeGuidanceLink helpSlug="accelerator-chooser" label="Open the full accelerator chooser guide" />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {ACCELERATOR_CHOOSER_ENTRIES.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                data-testid={`accelerator-chooser-row-${entry.id}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{entry.buyerJob}</h3>
                  <span
                    className={cn(
                      "rounded bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                      OPERATOR_TYPOGRAPHY.badge,
                    )}
                  >
                    {entry.scopeLabel}
                  </span>
                </div>
                <p className="m-0 mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">{entry.packLabel}</p>
                <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">{entry.summary}</p>
                <p className="m-0 mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Inputs: </span>
                  {entry.requiredInputs}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Outputs: </span>
                  {entry.expectedOutputs}
                </p>
                <Link
                  href={entry.startHref}
                  className="mt-3 inline-flex text-sm font-medium text-teal-800 underline decoration-teal-600/50 underline-offset-2 hover:text-teal-950 dark:text-teal-300 dark:hover:text-teal-100"
                  data-testid={`accelerator-chooser-start-${entry.id}`}
                >
                  Start with this pack
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
