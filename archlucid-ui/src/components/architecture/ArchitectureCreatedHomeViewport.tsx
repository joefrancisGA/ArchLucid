import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_CREATED_CONFIRMATION,
  ARCHITECTURE_CREATED_DEFINITION_STATUS_HEADING,
  ARCHITECTURE_CREATED_MISSING_HEADING,
  ARCHITECTURE_CREATED_NEXT_STEP_HEADING,
  ARCHITECTURE_CREATED_OVERFLOW_LABEL,
  ARCHITECTURE_CREATED_SUMMARY_HEADING,
} from "@/lib/architecture/architecture-created-home-copy";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedHomeViewportProps = {
  readonly model: ArchitectureCreatedHomeModel;
};

/** Architecture-first first viewport after create-architecture intake spawns a run. */
export function ArchitectureCreatedHomeViewport(
  props: ArchitectureCreatedHomeViewportProps,
): React.JSX.Element {
  const { model } = props;
  const primaryAction = model.primaryActions.find((action) => action.primary) ?? model.primaryActions[0];
  const secondaryActions = model.primaryActions.filter((action) => action !== primaryAction);

  return (
    <section
      className="space-y-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-5"
      data-testid="architecture-created-home-viewport"
      aria-labelledby="architecture-created-home-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_CREATED_CONFIRMATION}
          </p>
          <h1
            id="architecture-created-home-title"
            className={cn(
              "m-0 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl",
            )}
          >
            {model.architectureName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind={model.lifecycleStatusTagKind} label={model.lifecycleLabel} />
            {model.ownerLabel !== null ? (
              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Owner: {model.ownerLabel}
              </span>
            ) : null}
            <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Updated {model.lastUpdatedLabel}
            </span>
          </div>
        </div>

        <details className="relative">
          <summary
            className={cn(
              "cursor-pointer list-none rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="architecture-created-overflow-menu"
          >
            {ARCHITECTURE_CREATED_OVERFLOW_LABEL}
          </summary>
          <div className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-md border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-950">
            <ul className="m-0 list-none space-y-1 p-0">
              {model.overflowActions.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className={cn(
                      "block rounded px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
              {ARCHITECTURE_CREATED_SUMMARY_HEADING}
            </h2>
            {model.summaryFields.length > 0 ? (
              <dl className={cn("m-0 grid gap-3", OPERATOR_TYPOGRAPHY.body)}>
                {model.summaryFields.map((field) => (
                  <div key={field.label}>
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">{field.label}</dt>
                    <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Add more detail in clarifying questions to strengthen this summary.
              </p>
            )}
          </div>

          {model.missingItems.length > 0 ? (
            <div className="space-y-2" data-testid="architecture-created-missing-items">
              <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
                {ARCHITECTURE_CREATED_MISSING_HEADING}
              </h2>
              <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
                {model.missingItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={OPERATOR_BODY_INLINE_LINK_CLASS}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div
            className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            data-testid="architecture-created-definition-status"
          >
            <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
              {ARCHITECTURE_CREATED_DEFINITION_STATUS_HEADING}
            </h2>
            <p className={cn("m-0 mt-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {model.definitionStatusLabel}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Based on the brief and people or systems you provided so far.
            </p>
          </div>

          <div className="space-y-2" data-testid="architecture-created-primary-actions">
            <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
              {ARCHITECTURE_CREATED_NEXT_STEP_HEADING}
            </h2>
            {primaryAction !== undefined ? (
              <Button type="button" variant="primary" asChild data-testid="architecture-created-primary-action">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : null}
            {secondaryActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((action) => (
                  <Button
                    key={action.kind}
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid={`architecture-created-secondary-action-${action.kind}`}
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
