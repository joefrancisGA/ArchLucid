"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AccountSecurityAuthDomainsVocabularyRail } from "@/components/AccountSecurityAuthDomainsVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AccountSecuritySettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
  ACCOUNT_SECURITY_PAGE_SUBTITLE,
  ACCOUNT_SECURITY_PAGE_TITLE,
} from "@/lib/account-security-page-copy";
import {
  ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT,
  ACCOUNT_SECURITY_DEMO_BLOCKED_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
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
  isPlausibleEmailAddress,
  isSixDigitVerificationCode,
  msUntilExpiry,
  type SignInMethodsProblem,
} from "@/lib/sign-in-methods-problem";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { appSiteHref } from "@/lib/site-urls";

import { AccountSecurityAddEmailForm } from "./AccountSecurityAddEmailForm";
import {
  AccountSecurityFeedbackCallout,
  type AccountSecurityCardFeedback,
} from "./AccountSecurityFeedbackCallout";
import {
  ACCOUNT_SECURITY_REMOVE_WARNING,
  AccountSecurityRemoveDialog,
} from "./AccountSecurityRemoveDialog";
import { AccountSecuritySignInMethodsList } from "./AccountSecuritySignInMethodsList";

function accountSecuritySignInHref(): string {
  return appSiteHref(
    buildAuthSignInHref({
      returnPath: ACCOUNT_SECURITY_PATH,
    }),
  );
}

function accountSecuritySignInAgainHref(): string {
  return appSiteHref(
    buildAuthSignInHref({
      reason: "session-expired",
      returnPath: ACCOUNT_SECURITY_PATH,
    }),
  );
}

function problemToFeedback(problem: SignInMethodsProblem): AccountSecurityCardFeedback {
  if (problem.kind === "unauthorized-platform-user" || problem.kind === "recent-auth-required") {
    return { tone: "blocked", message: problem.message };
  }

  if (problem.kind === "validation") {
    return { tone: "warn", message: problem.message };
  }

  return { tone: "blocked", message: problem.message };
}

export function AccountSecurityPageClient() {
  const [methods, setMethods] = useState<SignInMethodSummary[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listFeedback, setListFeedback] = useState<AccountSecurityCardFeedback | null>(null);
  const [addFeedback, setAddFeedback] = useState<AccountSecurityCardFeedback | null>(null);
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

  const frictionless = typeof window !== "undefined" && readFrictionlessTrialSessionEnabled();
  const isDemoSession = frictionless || gateProblem?.kind === "demo-session-blocked";

  const emailValid = isPlausibleEmailAddress(addEmail);
  const codeValid = isSixDigitVerificationCode(verificationCode);
  const proposalRemainingMs = pendingProposal ? msUntilExpiry(pendingProposal.expiresUtc, nowMs) : null;
  const proposalExpired = proposalRemainingMs !== null && proposalRemainingMs <= 0;
  const resendCooldownMs = Math.max(0, resendCooldownUntilMs - nowMs);
  const blockedForAuth =
    isDemoSession ||
    gateProblem?.kind === "unauthorized-platform-user" ||
    gateProblem?.kind === "recent-auth-required";
  const showRecentAuthGateCallout = gateProblem?.kind === "recent-auth-required";

  const refreshMethods = useCallback(async (options?: { readonly preserveListFeedback?: boolean }) => {
    setLoading(true);

    if (!options?.preserveListFeedback) {
      setListFeedback(null);
    }

    if (readFrictionlessTrialSessionEnabled()) {
      setGateProblem({
        kind: "demo-session-blocked",
        message: ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
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
      setAddFeedback({ tone: "info", message: "Link canceled." });
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

  const authBlockedEmptyProps = isDemoSession
    ? ACCOUNT_SECURITY_DEMO_BLOCKED_EMPTY_COMPACT
    : {
        ...ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT,
        actions: [
          {
            label: "Sign in",
            href: accountSecuritySignInHref(),
            variant: "primary" as const,
          },
        ],
      };

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="account-security-page">
      <OperatorPageHeader
        title={ACCOUNT_SECURITY_PAGE_TITLE}
        subtitle={ACCOUNT_SECURITY_PAGE_SUBTITLE}
        titleTestId="account-security-page-title"
        actions={<PageContextualHelpButton />}
      />
      <AccountSecuritySettingsEvidenceOrientationStrip />
      <AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="account-security" />
      {showRecentAuthGateCallout && gateProblem !== null ? (
        <AccountSecurityFeedbackCallout
          feedback={problemToFeedback(gateProblem)}
          testId="account-security-auth-gate"
          actions={
            <Button type="button" size="sm" variant="primary" asChild>
              <Link href={accountSecuritySignInAgainHref()}>Sign in again</Link>
            </Button>
          }
        />
      ) : null}

      <AccountSecuritySignInMethodsList
        loading={loading}
        listLoaded={listLoaded}
        methods={methods}
        blockedForAuth={blockedForAuth}
        showRecentAuthGateCallout={showRecentAuthGateCallout}
        busy={busy}
        listFeedback={listFeedback}
        authBlockedEmptyProps={authBlockedEmptyProps}
        onRefresh={() => {
          void refreshMethods();
        }}
        onRemoveMethod={setMethodToRemove}
      />

      {!blockedForAuth ? (
        <AccountSecurityAddEmailForm
          busy={busy}
          addEmail={addEmail}
          emailTouched={emailTouched}
          emailValid={emailValid}
          challengeId={challengeId}
          verificationCode={verificationCode}
          codeValid={codeValid}
          pendingProposal={pendingProposal}
          proposalRemainingMs={proposalRemainingMs}
          proposalExpired={proposalExpired}
          resendCooldownMs={resendCooldownMs}
          addFeedback={addFeedback}
          onAddEmailChange={setAddEmail}
          onEmailBlur={() => {
            setEmailTouched(true);
          }}
          onVerificationCodeChange={setVerificationCode}
          onRequestEmailChallenge={() => {
            void handleRequestEmailChallenge();
          }}
          onVerifyEmailChallenge={() => {
            void handleVerifyEmailChallenge();
          }}
          onConfirmProposal={() => {
            void handleConfirmProposal();
          }}
          onCancelProposal={() => {
            void handleCancelProposal();
          }}
          onResetAddFlow={resetAddFlow}
          onClearAddFeedback={() => {
            setAddFeedback(null);
          }}
        />
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
    </OperatorPageContainer>
  );
}

// Re-export for tests that previously asserted on window.confirm copy.
export { ACCOUNT_SECURITY_REMOVE_WARNING };
