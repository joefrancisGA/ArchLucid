"use client";

import Link from "next/link";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_CONNECTION_CLIENT_APP_ID_LABEL,
  AZURE_CONNECTION_POST_SAVE_VALIDATE_LEAD,
  AZURE_CONNECTION_SAVE_VALIDATE_LEAD,
  AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED,
  AZURE_CONNECTION_VALIDATION_BUTTON_LABEL,
  AZURE_CONNECTION_VALIDATION_PREREQUISITES,
} from "@/lib/azure-cloud-connection-copy";
import { CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { cn } from "@/lib/utils";

import { CloudSecurityPreflightPanel } from "./CloudSecurityPreflightPanel";
import { TIER2_WIZARD_HELP_HREFS } from "./tier2-connection-wizard-content";
import type { Tier2ConnectionWizardViewModel } from "./use-tier2-connection-wizard";

type Tier2ConnectionValidateStepProps = Pick<
  Tier2ConnectionWizardViewModel,
  | "workspaceBindingLabel"
  | "workspaceBindingCallout"
  | "tenantId"
  | "clientId"
  | "subscriptionIds"
  | "savedConnection"
  | "isValidating"
  | "canRunValidation"
  | "handleValidateHostedRun"
  | "validationMessage"
  | "validationSucceeded"
  | "verifiedTopics"
  | "canMutate"
>;

export function Tier2ConnectionValidateStep({
  workspaceBindingLabel,
  workspaceBindingCallout,
  tenantId,
  clientId,
  subscriptionIds,
  savedConnection,
  isValidating,
  canRunValidation,
  handleValidateHostedRun,
  validationMessage,
  validationSucceeded,
  verifiedTopics,
  canMutate,
}: Tier2ConnectionValidateStepProps): React.ReactElement {
  return (
    <section className="space-y-4" aria-labelledby="tier2-wizard-save-heading">
      <div>
        <h3 id="tier2-wizard-save-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Save and validate
        </h3>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_CONNECTION_SAVE_VALIDATE_LEAD}</p>
      </div>

      {workspaceBindingCallout !== null ? (
        <p className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)} data-testid="tier2-workspace-binding-callout">
          {workspaceBindingCallout}
        </p>
      ) : null}

      <dl className={cn("grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4", OPERATOR_TYPOGRAPHY.body)}>
        <dt className="text-muted-foreground">Workspace</dt>
        <dd data-testid="tier2-summary-workspace">{workspaceBindingLabel}</dd>
        <dt className="text-muted-foreground">Tenant ID</dt>
        <dd data-testid="tier2-summary-tenant">{tenantId.trim() || " — "}</dd>
        <dt className="text-muted-foreground">{AZURE_CONNECTION_CLIENT_APP_ID_LABEL}</dt>
        <dd data-testid="tier2-summary-client">{clientId.trim() || " — "}</dd>
        <dt className="text-muted-foreground">Subscriptions</dt>
        <dd data-testid="tier2-summary-subscriptions">{subscriptionIds.trim() || " — "}</dd>
      </dl>

      {savedConnection !== null ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 p-4"
          aria-busy={isValidating}
          aria-live="polite"
        >
          <OperatorSuccessCallout
            message={CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE}
            testId="tier2-connection-save-success-callout"
          />
          <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {AZURE_CONNECTION_POST_SAVE_VALIDATE_LEAD}
          </p>
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="tier2-validation-prerequisites">
            {AZURE_CONNECTION_VALIDATION_PREREQUISITES}
          </p>
          <Button
            type="button"
            variant="outline"
            data-testid="tier2-validate-hosted-run"
            disabled={isValidating || !canRunValidation}
            aria-describedby={!canRunValidation ? "tier2-validation-admin-required-hint" : undefined}
            onClick={() => void handleValidateHostedRun()}
          >
            {isValidating ? "Validating…" : AZURE_CONNECTION_VALIDATION_BUTTON_LABEL}
          </Button>

          {!canRunValidation ? (
            <p id="tier2-validation-admin-required-hint" className={OPERATOR_TYPOGRAPHY.helper}>
              {AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED}
            </p>
          ) : null}

          {validationMessage ? (
            <p
              className={
                validationSucceeded
                  ? cn(OPERATOR_TYPOGRAPHY.body, "text-teal-800 dark:text-teal-200")
                  : cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")
              }
              role="status"
              data-testid="tier2-validation-message"
            >
              {validationMessage}
            </p>
          ) : null}
          {validationSucceeded ? (
            <CloudSecurityPreflightPanel
              topics={cloudSecurityPreflightTopics("azure")}
              providerLabel="Azure"
              collapsedByDefault={false}
              verifiedTopics={verifiedTopics}
            />
          ) : null}
        </div>
      ) : null}

      <p className={OPERATOR_TYPOGRAPHY.helper}>
        Access boundaries:{" "}
        <Link href={TIER2_WIZARD_HELP_HREFS.securityTrust} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          customer trust and access
        </Link>
        .
      </p>

      {!canMutate ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Elevated workspace permissions required to save a cloud connection.</p>
      ) : null}
    </section>
  );
}
