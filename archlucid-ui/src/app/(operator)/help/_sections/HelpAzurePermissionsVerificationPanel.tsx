"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { validateTier2ConnectionHostedRun } from "@/lib/api/cloud-connections-api";
import { AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR } from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_VERIFY_HEADING,
  AZURE_PERMISSIONS_VERIFY_INTRO,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { AUTHORITY_RANK } from "@/lib/authority-rank";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useNavCallerAuthorityRank } from "@/lib/nav-caller-authority-rank";
import { resolveApiErrorMessage } from "@/lib/resolve-api-error-message";
import { cn } from "@/lib/utils";

export type AzurePermissionsVerificationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "confirmed"; resourceCount: number; subscriptionId: string }
  | { status: "missing"; message: string }
  | { status: "failed"; message: string; technicalDetail?: string };

type HelpAzurePermissionsVerificationPanelProps = {
  readonly subscriptionId?: string;
};

function sanitizeVerificationError(error: unknown): { message: string; technicalDetail?: string } {
  const fallback = "Verification could not be completed. Confirm role assignments and try again.";
  const raw = resolveApiErrorMessage(error, fallback);

  if (/stack|trace|exception|System\./i.test(raw)) {
    return { message: fallback };
  }

  if (/403|forbidden|unauthorized|401/i.test(raw)) {
    return {
      message:
        "Required Reader access was not detected for the selected subscription. Confirm the role assignment scope and identity.",
      technicalDetail: raw.length < 160 ? raw : undefined,
    };
  }

  if (/404|not found|not configured/i.test(raw)) {
    return {
      message: "No saved Azure connection was found for this subscription. Save the connection before verifying.",
    };
  }

  if (/503|disabled/i.test(raw)) {
    return {
      message: "Hosted validation is not enabled in this environment. Contact your ArchLucid administrator.",
    };
  }

  return { message: raw.length > 240 ? fallback : raw };
}

export function HelpAzurePermissionsVerificationPanel(props: HelpAzurePermissionsVerificationPanelProps) {
  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [state, setState] = useState<AzurePermissionsVerificationState>({ status: "idle" });
  const subscriptionId = props.subscriptionId?.trim() ?? "";

  const statusLabel = useMemo((): string => {
    switch (state.status) {
      case "idle":
        return "Not checked";
      case "checking":
        return "Checking permissions";
      case "confirmed":
        return "Required access confirmed";
      case "missing":
        return "Required permission missing";
      case "failed":
        return "Verification could not be completed";
      default: {
        const exhaustive: never = state;
        return exhaustive;
      }
    }
  }, [state]);

  const verify = useCallback(async () => {
    if (subscriptionId.length === 0) {
      setState({
        status: "missing",
        message: "Enter a subscription ID on the Azure connection page before running verification.",
      });

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
      const sanitized = sanitizeVerificationError(error);
      setState({
        status: sanitized.message.includes("not detected") ? "missing" : "failed",
        message: sanitized.message,
        technicalDetail: sanitized.technicalDetail,
      });
    }
  }, [subscriptionId]);

  return (
    <section className="space-y-3" data-testid="azure-permissions-verify-section" aria-labelledby="azure-permissions-verify-heading">
      <h2 id="azure-permissions-verify-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {AZURE_PERMISSIONS_VERIFY_HEADING}
      </h2>
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{AZURE_PERMISSIONS_VERIFY_INTRO}</p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status" aria-live="polite">
        Status: {statusLabel}
      </p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.checks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canRunValidation || state.status === "checking" || subscriptionId.length === 0}
          onClick={() => void verify()}
          data-testid="azure-permissions-verify-button"
        >
          {state.status === "checking" ? "Checking permissions…" : "Verify Azure permissions"}
        </Button>
      </div>
      {!canRunValidation ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Administrator access is required to run a hosted validation pull.
        </p>
      ) : null}
      {subscriptionId.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Add <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">?subscriptionId=</code> to this page URL
          or verify from the Azure connection setup after saving.
        </p>
      ) : null}
      {state.status === "confirmed" ? (
        <p className={cn("m-0 font-medium text-emerald-800 dark:text-emerald-300", OPERATOR_TYPOGRAPHY.body)} data-testid="azure-permissions-verify-success">
          Reader access confirmed for subscription {state.subscriptionId}. Validation collected {state.resourceCount}{" "}
          resources.
        </p>
      ) : null}
      {(state.status === "missing" || state.status === "failed") && (
        <p className={cn("m-0 text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} data-testid="azure-permissions-verify-failure">
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
