"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE,
  AZURE_BOARDS_HELP_TOPIC_HREF,
  AZURE_BOARDS_HELP_TOPIC_LABEL,
  AZURE_BOARDS_LATEST_TEST_FAILED_LABEL,
  AZURE_BOARDS_LATEST_TEST_PASSED_LABEL,
  AZURE_BOARDS_LATEST_TEST_TITLE,
  AZURE_BOARDS_PERMISSIONS_ASIDE_BODY,
  AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE,
  AZURE_BOARDS_SETUP_PROGRESS_TITLE,
  AZURE_BOARDS_TROUBLESHOOTING_HELP_LABEL,
} from "@/lib/azure-boards-page-copy";
import {
  resolveAzureBoardsSetupStepTagLabel,
  type AzureBoardsConnectionStatusPresentation,
  type AzureBoardsSetupStep,
} from "@/lib/azure-boards-integration-present";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type Props = {
  readonly status: AzureBoardsConnectionStatusPresentation;
  readonly setupSteps: readonly AzureBoardsSetupStep[];
  readonly emphasizedSetupStepId: string;
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly showOperatorNotes: boolean;
  readonly nativeEnabled: boolean;
};

function AzureBoardsSetupStepLabel(props: {
  readonly step: AzureBoardsSetupStep;
  readonly emphasizedSetupStepId: string;
}): React.ReactElement {
  const { step, emphasizedSetupStepId } = props;
  const className = cn(
    step.complete ? "text-al-text-primary" : "text-al-text-secondary",
    step.id === emphasizedSetupStepId ? "font-medium text-al-text-primary" : undefined,
  );

  if (step.href && step.href.startsWith("/")) {
    return (
      <Link href={step.href} className={cn(OPERATOR_LINK.inline, className)}>
        {step.label}
      </Link>
    );
  }

  if (step.href) {
    return (
      <a href={step.href} className={cn(OPERATOR_LINK.inline, className)}>
        {step.label}
      </a>
    );
  }

  return <span className={className}>{step.label}</span>;
}

export function AzureBoardsIntegrationAside(props: Props): React.ReactElement {
  return (
    <aside
      className="space-y-4"
      data-testid="azure-boards-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_SETUP_PROGRESS_TITLE}</h2>
        <ol
          className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
          aria-label="Azure Boards setup progress"
          data-testid="azure-boards-setup-progress"
        >
          {props.setupSteps.map((step) => (
            <li
              key={step.id}
              className="flex items-start justify-between gap-3"
              aria-current={step.id === props.emphasizedSetupStepId ? "step" : undefined}
              data-testid={`azure-boards-setup-step-${step.id}`}
              data-emphasized={step.id === props.emphasizedSetupStepId ? "true" : undefined}
            >
              <AzureBoardsSetupStepLabel step={step} emphasizedSetupStepId={props.emphasizedSetupStepId} />
              <StatusTag
                kind={step.complete ? "ready" : step.id === props.emphasizedSetupStepId ? "in-progress" : "neutral"}
                label={resolveAzureBoardsSetupStepTagLabel(step, props.emphasizedSetupStepId)}
              />
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
            <div className="mt-2 space-y-2">
              <StatusTag
                kind={props.lastTestSuccess === false ? "needs-attention" : "ready"}
                label={
                  props.lastTestSuccess === false
                    ? AZURE_BOARDS_LATEST_TEST_FAILED_LABEL
                    : AZURE_BOARDS_LATEST_TEST_PASSED_LABEL
                }
              />
              <p
                role={props.lastTestSuccess === false ? "alert" : "status"}
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {props.lastTestSummary}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE}</h2>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          <li>
            <Link
              href={AZURE_BOARDS_HELP_TOPIC_HREF}
              className={cn(OPERATOR_LINK.inline)}
              data-testid="azure-boards-help-guide-link"
            >
              {AZURE_BOARDS_HELP_TOPIC_LABEL}
            </Link>
          </li>
          <li>
            <Link href={inAppHelpHref("troubleshooting")} className={cn(OPERATOR_LINK.inline)}>
              {AZURE_BOARDS_TROUBLESHOOTING_HELP_LABEL}
            </Link>
          </li>
        </ul>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection title="Platform administrator notes" defaultOpen={false}>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Native work item creation from findings is {props.nativeEnabled ? "enabled" : "disabled"} for this
            deployment.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
