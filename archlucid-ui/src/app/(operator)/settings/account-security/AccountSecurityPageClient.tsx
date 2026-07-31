"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  cancelSignInMethodLinkProposal,
  confirmSignInMethodLinkProposal,
  fetchSignInMethods,
  removeSignInMethod,
  requestEmailLinkChallenge,
  verifyEmailLinkChallenge,
  type AuthenticationIdentityLinkProposal,
  type SignInMethodSummary,
} from "@/lib/sign-in-methods-api";
import { cn } from "@/lib/utils";

const REMOVE_WARNING =
  "Removing a sign-in method cannot be undone. You must keep at least one way to sign in. Organization SSO requirements may block removal of your last enterprise method.";

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function AccountSecurityPageClient() {
  const [methods, setMethods] = useState<SignInMethodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [addEmail, setAddEmail] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingProposal, setPendingProposal] = useState<AuthenticationIdentityLinkProposal | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshMethods = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const rows = await fetchSignInMethods();
      setMethods(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMethods();
  }, [refreshMethods]);

  async function handleRequestEmailChallenge() {
    if (busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setPendingProposal(null);

    setBusy(true);

    try {
      const response = await requestEmailLinkChallenge(addEmail.trim());
      setChallengeId(response.challengeId);
      setStatusMessage("Verification code sent. Enter the code to continue.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyEmailChallenge() {
    if (challengeId === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const proposal = await verifyEmailLinkChallenge(challengeId, verificationCode.trim());
      setPendingProposal(proposal);
      setStatusMessage("Review the link details and confirm to add this sign-in method.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmProposal() {
    if (pendingProposal === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await confirmSignInMethodLinkProposal(pendingProposal.proposalId);
      setPendingProposal(null);
      setChallengeId(null);
      setAddEmail("");
      setVerificationCode("");
      setStatusMessage("Sign-in method added.");
      await refreshMethods();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelProposal() {
    if (pendingProposal === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await cancelSignInMethodLinkProposal(pendingProposal.proposalId);
      setPendingProposal(null);
      setChallengeId(null);
      setVerificationCode("");
      setStatusMessage("Link cancelled.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMethod(method: SignInMethodSummary) {
    if (!method.canRemove || busy) {
      return;
    }

    const confirmed = window.confirm(
      `${REMOVE_WARNING}\n\nRemove ${method.providerLabel}${method.maskedIdentifier ? ` (${method.maskedIdentifier})` : ""}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await removeSignInMethod(method.identityId);
      setStatusMessage("Sign-in method removed.");
      await refreshMethods();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="account-security-page">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Account security</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Manage how you sign in. Adding a method requires a fresh sign-in. Email matches alone never link accounts.
        </p>
      </div>

      {statusMessage ? (
        <p className="m-0 text-sm text-teal-800 dark:text-teal-300" role="status">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="m-0 text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Card data-testid="sign-in-methods-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Sign-in methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading sign-in methods…</p>
          ) : methods.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No sign-in methods are linked yet.
            </p>
          ) : (
            <ul className="m-0 list-none space-y-3 p-0">
              {methods.map((method) => (
                <li
                  key={method.identityId}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-al-border p-3"
                  data-testid={`sign-in-method-${method.identityId}`}
                >
                  <div>
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {method.providerLabel}
                    </p>
                    {method.maskedIdentifier ? (
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                        {method.maskedIdentifier}
                      </p>
                    ) : null}
                    <p className={cn("m-0 mt-1 text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                      Added {formatTimestamp(method.addedUtc)}
                      {method.lastUsedUtc ? ` · Last used ${formatTimestamp(method.lastUsedUtc)}` : ""}
                      {!method.isActive ? " · Inactive" : ""}
                    </p>
                  </div>
                  {method.canRemove ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      data-testid={`sign-in-method-remove-${method.identityId}`}
                      onClick={() => void handleRemoveMethod(method)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card data-testid="add-sign-in-method-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Add sign-in method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Add email-code recovery while signed in through your existing method. A different verified email will require
            explicit confirmation before linking.
          </p>

          <div className="space-y-2">
            <label className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} htmlFor="link-email">
              Email for one-time code
            </label>
            <Input
              id="link-email"
              type="email"
              autoComplete="email"
              value={addEmail}
              onChange={(event) => setAddEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <Button
            type="button"
            data-testid="account-security-send-code"
            onClick={() => void handleRequestEmailChallenge()}
            disabled={busy || !addEmail.trim()}
          >
            Send verification code
          </Button>

          {challengeId !== null ? (
            <div className="space-y-3 border-t border-al-border pt-4">
              <label className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} htmlFor="link-code">
                Verification code
              </label>
              <Input
                id="link-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="6-digit code"
              />
              <Button
                type="button"
                data-testid="account-security-verify-code"
                onClick={() => void handleVerifyEmailChallenge()}
                disabled={busy || !verificationCode.trim()}
              >
                Verify code
              </Button>
            </div>
          ) : null}

          {pendingProposal !== null ? (
            <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                Confirm new sign-in method
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {pendingProposal.confirmationMessage}
              </p>
              {pendingProposal.maskedIdentifier ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  Identifier: {pendingProposal.maskedIdentifier}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  data-testid="account-security-confirm-link"
                  onClick={() => void handleConfirmProposal()}
                  disabled={busy}
                >
                  Confirm link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid="account-security-cancel-link"
                  onClick={() => void handleCancelProposal()}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
