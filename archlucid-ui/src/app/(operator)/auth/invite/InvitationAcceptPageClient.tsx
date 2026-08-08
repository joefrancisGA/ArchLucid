"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setErrorMessage("This invitation link is not valid.");
      setLoading(false);

      return;
    }

    storeInvitationToken(token);

    void (async () => {
      try {
        const result = await validateInvitationToken(token);
        setValidation(result);

        if (result.status !== "Valid") {
          setErrorMessage(resolveInvalidMessage(result.status));
        }
      } catch {
        setErrorMessage("We could not validate this invitation. Try again or contact your administrator.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const signInHref = `/auth/signin?invitationToken=${encodeURIComponent(token)}`;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-6" data-testid="invitation-accept-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Workspace invitation</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Sign in to accept your invitation. We never grant access until you authenticate and confirm.
        </p>
      </div>

      {loading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Validating invitation…</p>
      ) : null}

      {errorMessage ? (
        <p className="m-0 text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {validation?.status === "Valid" ? (
        <div className="space-y-4 rounded-md border border-al-border p-4">
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
  );
}

function resolveInvalidMessage(status: InvitationValidationResponse["status"]): string {
  switch (status) {
    case "Expired":
      return "This invitation has expired. Ask your administrator to send a new invitation.";
    case "Revoked":
      return "This invitation is no longer active.";
    case "Accepted":
      return "This invitation has already been used.";
    default:
      return "This invitation link is not valid.";
  }
}
