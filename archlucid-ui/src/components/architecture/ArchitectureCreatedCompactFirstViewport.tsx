import { cn } from "@/lib/utils";
import Link from "next/link";

import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_CREATED_DEFINITION_STATUS_HEADING,
  ARCHITECTURE_CREATED_NEXT_STEP_HEADING,
  ARCHITECTURE_CREATED_SUMMARY_HEADING,
} from "@/lib/architecture/architecture-created-home-copy";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedCompactFirstViewportProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly runId: string;
  readonly architectureSourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions;
  readonly canEditDiagram: boolean;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  readonly mode?: "full" | "context-bar";
  readonly clarificationsTabHref?: string;
  readonly onClarificationsNavigate?: () => void;
  readonly onUnconfirmedInferredCountChange?: (count: number) => void;
};

function WorkspaceActionLink(props: {
  readonly href: string;
  readonly label: string;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  readonly testId?: string;
  readonly variant?: "primary" | "outline";
}): React.JSX.Element {
  const tab = readArchitectureWorkspaceTabFromHref(props.href);
  const variant = props.variant ?? "outline";

  if (tab !== null) {
    return (
      <Button
        type="button"
        variant={variant === "primary" ? "primary" : "outline"}
        size={variant === "primary" ? "default" : "sm"}
        data-testid={props.testId}
        onClick={() => {
          props.onNavigateTab(tab);
        }}
      >
        {props.label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant === "primary" ? "primary" : "outline"}
      size={variant === "primary" ? "default" : "sm"}
      asChild
      data-testid={props.testId}
    >
      <Link href={props.href}>{props.label}</Link>
    </Button>
  );
}

/** Compact above-the-fold summary, next action, and diagram preview for the architecture workspace. */
export function ArchitectureCreatedCompactFirstViewport(
  props: ArchitectureCreatedCompactFirstViewportProps,
): React.JSX.Element {
  const { model } = props;
  const mode = props.mode ?? "full";
  const primaryAction = model.primaryActions.find((action) => action.primary) ?? model.primaryActions[0];
  const secondaryActions = model.primaryActions.filter((action) => action !== primaryAction);
  const summaryFields = model.summaryFields.slice(0, 3);

  if (mode === "context-bar") {
    const summaryPreview = summaryFields[0]?.value ?? model.architectureName;

    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="architecture-created-compact-context-bar"
        aria-label="Architecture context"
      >
        <p className={cn("m-0 truncate text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{model.architectureName}</span>
          <span className="text-neutral-500 dark:text-neutral-400"> · </span>
          {summaryPreview}
          <span className="text-neutral-500 dark:text-neutral-400"> · </span>
          {model.definitionStatusLabel}
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-5"
      data-testid="architecture-created-compact-first-viewport"
      aria-label="Architecture summary and next steps"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {ARCHITECTURE_CREATED_SUMMARY_HEADING}
            </h2>
            {summaryFields.length > 0 ? (
              <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                {summaryFields.map((field) => (
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

          <ArchitectureDiagramPanel
            runId={props.runId}
            architectureName={model.architectureName}
            sourceText={props.architectureSourceText}
            userAssertions={props.userAssertions}
            canEdit={props.canEditDiagram}
            clarifyHref={props.clarificationsTabHref}
            onClarificationsNavigate={props.onClarificationsNavigate}
            variant="preview"
            onOpenFull={() => {
              props.onNavigateTab("diagram");
            }}
            onUnconfirmedInferredCountChange={props.onUnconfirmedInferredCountChange}
          />
        </div>

        <div className="space-y-4">
          <div
            className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            data-testid="architecture-created-definition-status"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
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
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {ARCHITECTURE_CREATED_NEXT_STEP_HEADING}
            </h2>
            {primaryAction !== undefined ? (
              <WorkspaceActionLink
                href={primaryAction.href}
                label={primaryAction.label}
                onNavigateTab={props.onNavigateTab}
                testId="architecture-created-primary-action"
                variant="primary"
              />
            ) : null}
            {secondaryActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((action) => (
                  <WorkspaceActionLink
                    key={action.kind}
                    href={action.href}
                    label={action.label}
                    onNavigateTab={props.onNavigateTab}
                    testId={`architecture-created-secondary-action-${action.kind}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
