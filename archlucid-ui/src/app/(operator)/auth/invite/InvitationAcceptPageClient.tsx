"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { InvitationAcceptLoadingView } from "@/app/(operator)/auth/invite/InvitationAcceptLoadingView";
import { InvitationInvalidRecoveryActions } from "@/app/(operator)/auth/invite/InvitationInvalidRecoveryActions";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUTH_INVITE_PAGE_LEAD,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";
import {
  mapInvitationStatusToRecoveryContext,
  resolveInvalidInvitationMessage,
  type InvitationRecoveryContext,
} from "@/lib/auth/invitation-invalid-recovery-copy";
import { storeInvitationToken } from "@/lib/auth/email-otp-session";
import {
  validateInvitationToken,
  type InvitationValidationResponse,
} from "@/lib/auth/invitation-validation-api";
import { cn } from "@/lib/utils";

export function InvitationAcceptPageClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [validation, setValidation] = useState<InvitationValidationResponse | null>(null);
  const [recoveryContext, setRecoveryContext] = useState<InvitationRecoveryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationAttempt, setValidationAttempt] = useState(0);

  const runValidation = useCallback(async (invitationToken: string) => {
    setLoading(true);
    setValidation(null);
    setRecoveryContext(null);

    try {
      const result = await validateInvitationToken(invitationToken);
      setValidation(result);

      const context = mapInvitationStatusToRecoveryContext(result.status);

      if (context) {
        setRecoveryContext(context);
      }
    } catch {
      setRecoveryContext("validation-failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setRecoveryContext("missing-token");
      setLoading(false);

      return;
    }

    storeInvitationToken(token);
    void runValidation(token);
  }, [runValidation, token, validationAttempt]);

  const signInHref = `/auth/signin?invitationToken=${encodeURIComponent(token)}`;

  if (loading) {
    return (
      <AuthFlowShell showEvaluationSignupLink={false}>
        <InvitationAcceptLoadingView />
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell showEvaluationSignupLink={false}>
      <div className="max-w-[560px]" data-testid="invitation-accept-page">
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_INVITE_PAGE_TITLE}</h1>
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{AUTH_INVITE_PAGE_LEAD}</p>

        {recoveryContext ? (
          <>
            <div
              className={cn("mt-4", DESIGN_TOKENS.callout.blocked)}
              role="alert"
              data-testid="invitation-invalid-alert"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                {resolveInvalidInvitationMessage(recoveryContext)}
              </p>
            </div>
            <InvitationInvalidRecoveryActions
              context={recoveryContext}
              onRetry={
                recoveryContext === "validation-failed" && token
                  ? () => {
                      setValidationAttempt((attempt) => attempt + 1);
                    }
                  : undefined
              }
            />
          </>
        ) : null}

        {validation?.status === "Valid" ? (
          <div className="mt-6 space-y-4 rounded-md border border-al-border p-4">
            {validation.maskedInvitedEmail ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Invited address: {validation.maskedInvitedEmail}
              </p>
            ) : null}
            {validation.appRole ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Role: {validation.appRole}
              </p>
            ) : null}
            {validation.requireEnterpriseSso && validation.routingMessage ? (
              <p className={cn("m-0 text-amber-800 dark:text-amber-300", OPERATOR_TYPOGRAPHY.body)}>
                {validation.routingMessage}
              </p>
            ) : null}
            <Button asChild>
              <Link href={signInHref}>Continue to sign in</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </AuthFlowShell>
  );
}
