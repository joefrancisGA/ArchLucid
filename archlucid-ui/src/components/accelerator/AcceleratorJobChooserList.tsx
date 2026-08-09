import { cn } from "@/lib/utils";
import Link from "next/link";

import {
  ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL,
  ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL,
  ACCELERATOR_JOB_CHOOSER_START_CTA,
} from "@/lib/accelerator-chooser-start-copy";
import { ACCELERATOR_CHOOSER_ENTRIES } from "@/lib/accelerator-chooser";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AcceleratorJobChooserListProps = {
  readonly listTestId?: string;
  readonly rowTestIdPrefix?: string;
  readonly startTestIdPrefix?: string;
  readonly className?: string;
};

/** Buyer-job rows with pack label and expected outputs — shared by home and first-run review start (TB-2136). */
export function AcceleratorJobChooserList(props: AcceleratorJobChooserListProps): React.JSX.Element {
  const rowPrefix = props.rowTestIdPrefix ?? "accelerator-chooser-row";
  const startPrefix = props.startTestIdPrefix ?? "accelerator-chooser-start";

  return (
    <ul
      className={cn("m-0 grid list-none gap-3 p-0 sm:grid-cols-2", props.className)}
      data-testid={props.listTestId}
    >
      {ACCELERATOR_CHOOSER_ENTRIES.map((entry) => (
        <li
          key={entry.id}
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          data-testid={`${rowPrefix}-${entry.id}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {entry.buyerJob}
            </h3>
            <span
              className={cn(
                "rounded bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                OPERATOR_TYPOGRAPHY.badge,
              )}
            >
              {entry.scopeLabel}
            </span>
          </div>
          <p className={cn("m-0 mt-1 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {entry.packLabel}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {entry.summary}
          </p>
          <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-neutral-600 dark:text-neutral-400">
              {ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL}:{" "}
            </span>
            {entry.requiredInputs}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-neutral-600 dark:text-neutral-400">
              {ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL}:{" "}
            </span>
            {entry.expectedOutputs}
          </p>
          <Link
            href={entry.startHref}
            className={cn("mt-3 inline-flex", OPERATOR_LINK.nav)}
            data-testid={`${startPrefix}-${entry.id}`}
          >
            {ACCELERATOR_JOB_CHOOSER_START_CTA}
          </Link>
        </li>
      ))}
    </ul>
  );
}
