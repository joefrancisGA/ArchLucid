"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { InvitationAcceptLoadingView } from "@/app/(operator)/auth/invite/InvitationAcceptLoadingView";
import { InvitationAuthSecondaryExitActions } from "@/app/(operator)/auth/invite/InvitationAuthSecondaryExitActions";
import { InvitationInvalidRecoveryActions } from "@/app/(operator)/auth/invite/InvitationInvalidRecoveryActions";
import { InvitationAcceptBuyerChrome } from "@/app/(operator)/auth/invite/InvitationAcceptBuyerChrome";
import { InvitationValidPanel } from "@/app/(operator)/auth/invite/InvitationValidPanel";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUTH_INVITE_PAGE_LEAD,
  AUTH_INVITE_PAGE_TITLE,
  AUTH_INVITE_VALIDATION_FAILURE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";
import { AUTH_INVITE_CLAIM_DISCIPLINE } from "@/lib/auth-invite-evidence-copy";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { clearInvitationToken, storeInvitationToken } from "@/lib/auth/email-otp-session";
import {
  mapInvitationStatusToRecoveryContext,
  resolveInvalidInvitationMessage,
  type InvitationRecoveryContext,
} from "@/lib/auth/invitation-invalid-recovery-copy";
import {
  validateInvitationToken,
  type InvitationValidationResponse,
} from "@/lib/auth/invitation-validation-api";
import { cn } from "@/lib/utils";

function invitationChrome(content: ReactNode): React.JSX.Element {
  return <InvitationAcceptBuyerChrome>{content}</InvitationAcceptBuyerChrome>;
}

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
        clearInvitationToken();
        setRecoveryContext(context);

        return;
      }

      storeInvitationToken(invitationToken);
    } catch {
      clearInvitationToken();
      setRecoveryContext("validation-failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      clearInvitationToken();
      setRecoveryContext("missing-token");
      setLoading(false);

      return;
    }

    void runValidation(token);
  }, [runValidation, token, validationAttempt]);

  const signInHref = `/auth/signin?invitationToken=${encodeURIComponent(token)}`;

  if (loading) {
    return invitationChrome(<InvitationAcceptLoadingView />);
  }

  return invitationChrome(
      <div className="max-w-[560px]" data-testid="invitation-accept-page">
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_INVITE_PAGE_TITLE}</h1>
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{AUTH_INVITE_PAGE_LEAD}</p>
        <PageHeaderClaimDiscipline
          text={AUTH_INVITE_CLAIM_DISCIPLINE}
          testId="auth-invite-claim-discipline"
          className="mt-3 text-left"
        />

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
            <FatalPageReportProblemSupportRow
              surfaceId="auth-invitation-accept-validation-failure"
              routePath="/auth/invite"
              errorTitle={AUTH_INVITE_VALIDATION_FAILURE_TITLE}
              errorCode={`invitation-${recoveryContext}`}
            />
            <InvitationAuthSecondaryExitActions showSignInAgain={false} />
          </>
        ) : null}

        {validation?.status === "Valid" ? (
          <InvitationValidPanel validation={validation} signInHref={signInHref} />
        ) : null}
      </div>,
  );
}
