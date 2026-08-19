"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { validateTier2ConnectionHostedRun } from "@/lib/api/cloud-connections-api";
import { AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR } from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_VERIFY_HEADING,
  AZURE_PERMISSIONS_VERIFY_INTRO,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { isAzureGuid } from "@/lib/azure-identifier-validation";
import { sanitizeHostedAzureValidationError } from "@/lib/sanitize-hosted-azure-validation-error";
import { cn } from "@/lib/utils";

export type AzurePermissionsVerificationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "confirmed"; resourceCount: number; subscriptionId: string }
  | { status: "missing"; message: string }
  | { status: "failed"; message: string; technicalDetail?: string };

type HelpAzurePermissionsVerificationPanelProps = {
  readonly subscriptionId?: string;
  readonly returnHref: string;
};

function verificationStateFromReason(
  sanitized: ReturnType<typeof sanitizeHostedAzureValidationError>,
): AzurePermissionsVerificationState {
  if (sanitized.reason === "permission") {
    return {
      status: "missing",
      message: sanitized.message,
    };
  }

  return {
    status: "failed",
    message: sanitized.message,
    technicalDetail: sanitized.technicalDetail,
  };
}

function verificationStatusTag(
  state: AzurePermissionsVerificationState,
): { kind: EnterpriseStatusKind; label: string } {
  switch (state.status) {
    case "idle":
      return { kind: "neutral", label: "Not checked" };
    case "checking":
      return { kind: "in-progress", label: "Checking permissions" };
    case "confirmed":
      return { kind: "ready", label: "Required access confirmed" };
    case "missing":
      return { kind: "needs-attention", label: "Required permission missing" };
    case "failed":
      return { kind: "blocked", label: "Verification could not be completed" };
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

export function HelpAzurePermissionsVerificationPanel(props: HelpAzurePermissionsVerificationPanelProps) {
  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [state, setState] = useState<AzurePermissionsVerificationState>({ status: "idle" });
  const subscriptionId = props.subscriptionId?.trim() ?? "";
  const hasSubscription = subscriptionId.length > 0 && isAzureGuid(subscriptionId);
  const statusTag = useMemo(() => verificationStatusTag(state), [state]);

  const verify = useCallback(async () => {
    if (!hasSubscription) {
      return;
    }

    setState({ status: "checking" });

    try {
      const response = await validateTier2ConnectionHostedRun({ subscriptionId });
      setState({
        status: "confirmed",
        resourceCount: response.resourceCount,
        subscriptionId,
      });
    } catch (error: unknown) {
      const sanitized = sanitizeHostedAzureValidationError(error);
      setState(verificationStateFromReason(sanitized));
    }
  }, [hasSubscription, subscriptionId]);

  return (
    <section className="space-y-3" data-testid="azure-permissions-verify-section" aria-labelledby="azure-permissions-verify-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="azure-permissions-verify-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {AZURE_PERMISSIONS_VERIFY_HEADING}
        </h2>
        <div role="status" aria-live="polite" data-testid="azure-permissions-verify-status">
          <StatusTag kind={statusTag.kind} label={statusTag.label} />
        </div>
      </div>
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{AZURE_PERMISSIONS_VERIFY_INTRO}</p>
      <div className="space-y-2">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Confirmed by this check</p>
        <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2" data-testid="azure-permissions-does-not-verify">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Not confirmed by this check</p>
        <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.doesNotVerify.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        {hasSubscription ? (
          <Button
            type="button"
            variant="primary"
            disabled={!canRunValidation || state.status === "checking"}
            onClick={() => void verify()}
            data-testid="azure-permissions-verify-button"
          >
            {state.status === "checking" ? "Checking permissions…" : "Verify Azure permissions"}
          </Button>
        ) : (
          <Button asChild data-testid="azure-permissions-verify-setup-link">
            <Link href={props.returnHref}>Open Azure connection setup to verify</Link>
          </Button>
        )}
      </div>
      {!canRunValidation && hasSubscription ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Administrator access is required to run a hosted validation pull.
        </p>
      ) : null}
      {state.status === "confirmed" ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="azure-permissions-verify-success">
          Reader access confirmed for subscription {state.subscriptionId}. Validation collected {state.resourceCount}{" "}
          resources. Cost Management Reader assignment was not validated — the hosted collector does not call cost APIs
          today.
        </p>
      ) : null}
      {(state.status === "missing" || state.status === "failed") && (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="azure-permissions-verify-failure">
          {state.message}
        </p>
      )}
      {state.status === "failed" && state.technicalDetail ? (
        <details className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <summary className="cursor-pointer font-medium">View technical details</summary>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{state.technicalDetail}</p>
        </details>
      ) : null}
    </section>
  );
}
