"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_BOARDS_CONNECTION_VERIFICATION_HELP_LABEL,
  AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE,
  AZURE_BOARDS_LATEST_TEST_TITLE,
  AZURE_BOARDS_PERMISSIONS_ASIDE_BODY,
  AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE,
  AZURE_BOARDS_SETUP_PROGRESS_TITLE,
} from "@/lib/azure-boards-page-copy";
import type {
  AzureBoardsConnectionStatusPresentation,
  AzureBoardsSetupStep,
} from "@/lib/azure-boards-integration-present";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type Props = {
  readonly status: AzureBoardsConnectionStatusPresentation;
  readonly setupSteps: readonly AzureBoardsSetupStep[];
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly showOperatorNotes: boolean;
  readonly nativeEnabled: boolean;
};

export function AzureBoardsIntegrationAside(props: Props): React.ReactElement {
  return (
    <aside className="space-y-4" data-testid="azure-boards-integration-aside">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_SETUP_PROGRESS_TITLE}</h2>
        <ol
          className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
          aria-label="Azure Boards setup progress"
        >
          {props.setupSteps.map((step) => (
            <li key={step.id} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.complete
                    ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300",
                )}
              >
                {step.complete ? "✓" : "·"}
              </span>
              <span className={step.complete ? "text-al-text-primary" : "text-al-text-secondary"}>{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_BOARDS_PERMISSIONS_ASIDE_BODY}
        </p>
      </div>

      {props.lastTestAt !== null ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="azure-boards-latest-test"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_LATEST_TEST_TITLE}</h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <time dateTime={props.lastTestAt}>{new Date(props.lastTestAt).toLocaleString()}</time>
          </p>
          {props.lastTestSummary ? (
            <p
              role={props.lastTestSuccess === false ? "alert" : "status"}
              className={cn(
                "m-0 mt-2 rounded-md border px-3 py-2",
                OPERATOR_TYPOGRAPHY.helper,
                props.lastTestSuccess === false
                  ? "border-red-200 text-red-800 dark:border-red-900 dark:text-red-200"
                  : "border-teal-200 text-teal-900 dark:border-teal-900 dark:text-teal-100",
              )}
            >
              {props.lastTestSummary}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE}</h2>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          <li>
            <Link href={inAppHelpHref("integrations/azure-boards")} className={cn(OPERATOR_LINK.inline)}>
              Azure Boards integration guide
            </Link>
          </li>
          <li>
            <Link href={inAppHelpHref("troubleshooting")} className={cn(OPERATOR_LINK.inline)}>
              {AZURE_BOARDS_CONNECTION_VERIFICATION_HELP_LABEL}
            </Link>
          </li>
        </ul>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection title="Platform operator notes" defaultOpen={false}>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Native work item creation from findings is {props.nativeEnabled ? "enabled" : "disabled"} for this
            deployment.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
