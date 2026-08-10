"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_PAGE_SUBTITLE,
  ACCOUNT_SECURITY_PAGE_TITLE,
} from "@/lib/account-security-page-copy";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { formatInstantForLocale } from "@/lib/locale-datetime";
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
import {
  classifySignInMethodsUnknownFailure,
  digitsOnlyMaxLength,
  formatCountdown,
  isPlausibleEmailAddress,
  isSixDigitVerificationCode,
  msUntilExpiry,
  type SignInMethodsProblem,
} from "@/lib/sign-in-methods-problem";
import { appSiteHref } from "@/lib/site-urls";
import { resolveSignInMethodRemoveBlockedReason } from "@/lib/sign-in-method-remove-blocked-copy";
import { cn } from "@/lib/utils";

import {
  ACCOUNT_SECURITY_REMOVE_WARNING,
  AccountSecurityRemoveDialog,
} from "./AccountSecurityRemoveDialog";
type FeedbackTone = "success" | "blocked" | "warn" | "info";

type CardFeedback = {
  readonly tone: FeedbackTone;
  readonly message: string;
};

function calloutClassForTone(tone: FeedbackTone): string {
  switch (tone) {
    case "success":
      return DESIGN_TOKENS.callout.success;
    case "blocked":
      return DESIGN_TOKENS.callout.blocked;
    case "warn":
      return DESIGN_TOKENS.callout.warn;
    case "info":
      return DESIGN_TOKENS.callout.info;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function problemToFeedback(problem: SignInMethodsProblem): CardFeedback {
  if (problem.kind === "unauthorized-platform-user" || problem.kind === "recent-auth-required") {
    return { tone: "blocked", message: problem.message };
  }

  if (problem.kind === "validation") {
    return { tone: "warn", message: problem.message };
  }

  return { tone: "blocked", message: problem.message };
}

function FeedbackCallout(props: {
  readonly feedback: CardFeedback;
  readonly testId: string;
  readonly actions?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(calloutClassForTone(props.feedback.tone), "px-3 py-2")}
      role={props.feedback.tone === "success" ? "status" : "alert"}
      data-testid={props.testId}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.feedback.message}</p>
      {props.actions ? <div className="mt-2 flex flex-wrap gap-2">{props.actions}</div> : null}
    </div>
  );
}

export function AccountSecurityPageClient() {
  const [methods, setMethods] = useState<SignInMethodSummary[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listFeedback, setListFeedback] = useState<CardFeedback | null>(null);
  const [addFeedback, setAddFeedback] = useState<CardFeedback | null>(null);
  const [gateProblem, setGateProblem] = useState<SignInMethodsProblem | null>(null);

  const [addEmail, setAddEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingProposal, setPendingProposal] = useState<AuthenticationIdentityLinkProposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<SignInMethodSummary | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resendCooldownUntilMs, setResendCooldownUntilMs] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const frictionless = typeof window !== "undefined" && readFrictionlessTrialSessionEnabled();

  const emailValid = isPlausibleEmailAddress(addEmail);
  const codeValid = isSixDigitVerificationCode(verificationCode);
  const proposalRemainingMs = pendingProposal ? msUntilExpiry(pendingProposal.expiresUtc, nowMs) : null;
  const proposalExpired = proposalRemainingMs !== null && proposalRemainingMs <= 0;
  const resendCooldownMs = Math.max(0, resendCooldownUntilMs - nowMs);
  const blockedForAuth =
    gateProblem?.kind === "unauthorized-platform-user" ||
    gateProblem?.kind === "recent-auth-required" ||
    frictionless;

  const refreshMethods = useCallback(async (options?: { readonly preserveListFeedback?: boolean }) => {
    setLoading(true);

    if (!options?.preserveListFeedback) {
      setListFeedback(null);
    }

    if (readFrictionlessTrialSessionEnabled()) {
      setGateProblem({
        kind: "unauthorized-platform-user",
        message: ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
      });
      setMethods([]);
      setListLoaded(false);
      setLoading(false);

      return;
    }

    try {
      const rows = await fetchSignInMethods();
      setMethods(rows);
      setListLoaded(true);
      setGateProblem(null);
    } catch (error) {
      const problem = classifySignInMethodsUnknownFailure(error);
      setMethods([]);
      setListLoaded(false);

      if (problem.kind === "unauthorized-platform-user" || problem.kind === "recent-auth-required") {
        setGateProblem(problem);
        setListFeedback(null);
      } else {
        setGateProblem(null);
        setListFeedback(problemToFeedback(problem));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMethods();
  }, [refreshMethods]);

  useEffect(() => {
    if (pendingProposal === null && resendCooldownUntilMs <= Date.now()) {
      return;
    }

    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [pendingProposal, resendCooldownUntilMs]);

  useEffect(() => {
    if (challengeId === null) {
      return;
    }

    codeInputRef.current?.focus();
  }, [challengeId]);

  function resetAddFlow() {
    setChallengeId(null);
    setVerificationCode("");
    setPendingProposal(null);
    setResendCooldownUntilMs(0);
  }

  async function handleRequestEmailChallenge() {
    if (busy || blockedForAuth || !emailValid) {
      return;
    }

    setAddFeedback(null);
    setPendingProposal(null);
    setBusy(true);

    try {
      const response = await requestEmailLinkChallenge(addEmail.trim());
      setChallengeId(response.challengeId);
      setResendCooldownUntilMs(Date.now() + 30_000);
      setAddFeedback({
        tone: "success",
        message: `We sent a 6-digit code to ${addEmail.trim()}.`,
      });
    } catch (error) {
      const problem = classifySignInMethodsUnknownFailure(error);

      if (problem.kind === "unauthorized-platform-user" || problem.kind === "recent-auth-required") {
        setGateProblem(problem);
      }

      setAddFeedback(problemToFeedback(problem));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyEmailChallenge() {
    if (challengeId === null || busy || blockedForAuth || !codeValid) {
      return;
    }

    setAddFeedback(null);
    setBusy(true);

    try {
      const proposal = await verifyEmailLinkChallenge(challengeId, verificationCode.trim());
      setPendingProposal(proposal);
      setAddFeedback({
        tone: "info",
        message: "Review the link details and confirm to add this sign-in method.",
      });
    } catch (error) {
      setAddFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmProposal() {
    if (pendingProposal === null || busy || blockedForAuth || proposalExpired) {
      return;
    }

    setAddFeedback(null);
    setBusy(true);

    try {
      await confirmSignInMethodLinkProposal(pendingProposal.proposalId);
      setPendingProposal(null);
      setChallengeId(null);
      setAddEmail("");
      setEmailTouched(false);
      setVerificationCode("");
      setAddFeedback({ tone: "success", message: "Sign-in method added." });
      await refreshMethods({ preserveListFeedback: true });
    } catch (error) {
      setAddFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelProposal() {
    if (pendingProposal === null || busy) {
      return;
    }

    setAddFeedback(null);
    setBusy(true);

    try {
      await cancelSignInMethodLinkProposal(pendingProposal.proposalId);
      resetAddFlow();
      setAddFeedback({ tone: "info", message: "Link cancelled." });
    } catch (error) {
      setAddFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmRemove() {
    if (methodToRemove === null || !methodToRemove.canRemove || busy) {
      return;
    }

    const method = methodToRemove;
    setListFeedback(null);
    setBusy(true);

    try {
      await removeSignInMethod(method.identityId);
      setMethodToRemove(null);
      setListFeedback({ tone: "success", message: "Sign-in method removed." });
      await refreshMethods({ preserveListFeedback: true });
    } catch (error) {
      setListFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }

  const authActions = (
    <>
      <Button type="button" size="sm" variant="primary" asChild>
        <Link href={appSiteHref("/auth/signin")}>Sign in</Link>
      </Button>
      <Button type="button" size="sm" variant="outline" asChild>
        <Link href="/signup">Start an evaluation</Link>
      </Button>
    </>
  );

  return (
    <div className="w-full max-w-[62rem] space-y-6" data-testid="account-security-page">
      <OperatorPageHeader
        title={ACCOUNT_SECURITY_PAGE_TITLE}
        subtitle={ACCOUNT_SECURITY_PAGE_SUBTITLE}
        titleTestId="account-security-page-title"
        actions={<PageContextualHelpButton />}
      />
{gateProblem ? (
        <FeedbackCallout
          feedback={problemToFeedback(gateProblem)}
          testId="account-security-auth-gate"
          actions={
            gateProblem.kind === "recent-auth-required" ? (
              <Button type="button" size="sm" variant="primary" asChild>
                <Link href={appSiteHref("/auth/signin")}>Sign in again</Link>
              </Button>
            ) : (
              authActions
            )
          }
        />
      ) : null}

      <Card data-testid="sign-in-methods-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Sign-in methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listFeedback ? (
            <FeedbackCallout
              feedback={listFeedback}
              testId="account-security-list-feedback"
              actions={
                listFeedback.tone === "blocked" && !blockedForAuth ? (
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void refreshMethods()}>
                    Try again
                  </Button>
                ) : null
              }
            />
          ) : null}

          {loading ? (
            <div className="space-y-3" data-testid="sign-in-methods-loading">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : blockedForAuth ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Sign-in methods appear here after you sign in to an ArchLucid account.
            </p>
          ) : listLoaded && methods.length === 0 ? (
            <div className="space-y-2">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                No sign-in methods are linked yet.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  document.getElementById("link-email")?.focus();
                }}
              >
                Add a sign-in method
              </Button>
            </div>
          ) : listLoaded ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {methods.map((method) => (
                <li
                  key={method.identityId}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-al-border p-3"
                  data-testid={`sign-in-method-${method.identityId}`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {method.providerLabel}
                      </p>
                      <BooleanStatusChip value={method.isActive} />
                    </div>
                    {method.maskedIdentifier ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                        {method.maskedIdentifier}
                      </p>
                    ) : null}
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Added {formatInstantForLocale(method.addedUtc)}
                      {method.lastUsedUtc
                        ? ` · Last used ${formatInstantForLocale(method.lastUsedUtc)}`
                        : ""}
                    </p>
                    {!method.canRemove ? (
                      <div className="pt-1">
                        <StatusTag kind="neutral" label="Cannot remove" />
                        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          {resolveSignInMethodRemoveBlockedReason(method, methods)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {method.canRemove ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy || blockedForAuth}
                      data-testid={`sign-in-method-remove-${method.identityId}`}
                      onClick={() => {
                        setMethodToRemove(method);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {!blockedForAuth ? (
        <Card data-testid="add-sign-in-method-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Add sign-in method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Add email-code recovery while signed in through your existing method. A different verified email will
              require explicit confirmation before linking.
            </p>

            {addFeedback ? <FeedbackCallout feedback={addFeedback} testId="account-security-add-feedback" /> : null}

            <ol className={cn("m-0 list-decimal space-y-4 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              <li className="space-y-2">
                <label
                  className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                  htmlFor="link-email"
                >
                  Email for one-time code
                </label>
                <Input
                  id="link-email"
                  type="email"
                  autoComplete="email"
                  value={addEmail}
                  aria-invalid={emailTouched && !emailValid ? true : undefined}
                  onChange={(event) => {
                    setAddEmail(event.target.value);
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                  }}
                  placeholder="you@example.com"
                  disabled={busy || challengeId !== null}
                />
                {emailTouched && !emailValid ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                    Enter a valid email address before sending a code.
                  </p>
                ) : null}
                {challengeId === null ? (
                  <Button
                    type="button"
                    data-testid="account-security-send-code"
                    onClick={() => void handleRequestEmailChallenge()}
                    disabled={busy || !emailValid}
                  >
                    Send verification code
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || resendCooldownMs > 0}
                      data-testid="account-security-resend-code"
                      onClick={() => void handleRequestEmailChallenge()}
                    >
                      {resendCooldownMs > 0
                        ? `Resend in ${formatCountdown(resendCooldownMs)}`
                        : "Resend code"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      data-testid="account-security-different-email"
                      onClick={() => {
                        resetAddFlow();
                        setAddFeedback(null);
                      }}
                    >
                      Use a different email
                    </Button>
                  </div>
                )}
              </li>

              {challengeId !== null ? (
                <li className="space-y-2 border-t border-al-border pt-4">
                  <label
                    className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                    htmlFor="link-code"
                  >
                    Verification code
                  </label>
                  <Input
                    ref={codeInputRef}
                    id="link-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(digitsOnlyMaxLength(event.target.value, 6));
                    }}
                    placeholder="6-digit code"
                    disabled={busy || pendingProposal !== null}
                  />
                  <Button
                    type="button"
                    data-testid="account-security-verify-code"
                    onClick={() => void handleVerifyEmailChallenge()}
                    disabled={busy || !codeValid || pendingProposal !== null}
                  >
                    Verify code
                  </Button>
                </li>
              ) : null}
            </ol>

            {pendingProposal !== null ? (
              <div
                className={cn(DESIGN_TOKENS.callout.warn, "space-y-3 px-3 py-3")}
                data-testid="account-security-confirm-panel"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag kind="needs-attention" label="Confirm link" />
                  {proposalRemainingMs !== null ? (
                    <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
                      {proposalExpired
                        ? "This confirmation expired."
                        : `Expires in ${formatCountdown(proposalRemainingMs)}`}
                    </span>
                  ) : null}
                </div>
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
                  {proposalExpired ? (
                    <Button
                      type="button"
                      data-testid="account-security-start-over"
                      onClick={() => {
                        resetAddFlow();
                        setAddFeedback(null);
                      }}
                      disabled={busy}
                    >
                      Start over
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      data-testid="account-security-confirm-link"
                      onClick={() => void handleConfirmProposal()}
                      disabled={busy}
                    >
                      Confirm link
                    </Button>
                  )}
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
      ) : null}

      <AccountSecurityRemoveDialog
        method={methodToRemove}
        busy={busy}
        onCancel={() => {
          setMethodToRemove(null);
        }}
        onConfirm={() => {
          void handleConfirmRemove();
        }}
      />
    </div>
  );
}

// Re-export for tests that previously asserted on window.confirm copy.
export { ACCOUNT_SECURITY_REMOVE_WARNING };
