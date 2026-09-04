"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ACCOUNT_SECURITY_DEMO_GATE_MESSAGE } from "@/lib/account-security-page-copy";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import {
  accountSecurityStepHrefFromSearch,
  parseAccountSecurityChallengeIdFromSearch,
  parseAccountSecurityStepFromSearch,
  type AccountSecurityStepUrlValue,
} from "@/lib/account/account-security-step-url";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT,
  ACCOUNT_SECURITY_DEMO_BLOCKED_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
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
import { appSiteHref } from "@/lib/site-urls";
import type { AccountSecurityCardFeedback } from "./AccountSecurityFeedbackCallout";

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

export type AccountSecurityPageController = ReturnType<typeof useAccountSecurityPage>;

export function useAccountSecurityPage() {
  const router = useRouter();
  const pathname = usePathname() ?? ACCOUNT_SECURITY_PATH;
  const searchParams = useSearchParams();
  const urlSecStep = parseAccountSecurityStepFromSearch(searchParams.get("secStep"));
  const urlChallengeId = parseAccountSecurityChallengeIdFromSearch(searchParams.get("challengeId"));
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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

  const syncAccountSecurityStepToUrl = useCallback(
    (step: AccountSecurityStepUrlValue | null, nextChallengeId: string | null) => {
      router.replace(
        accountSecurityStepHrefFromSearch(
          searchParams.toString(),
          { step, challengeId: nextChallengeId },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (urlChallengeId.length > 0) {
      setChallengeId(urlChallengeId);
    }

    if (urlSecStep === "verify" && urlChallengeId.length > 0) {
      return;
    }

    if (urlSecStep === "add-email") {
      setEmailTouched(true);
    }
  }, [urlChallengeId, urlSecStep]);

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

  const resetAddFlow = useCallback(() => {
    setChallengeId(null);
    setVerificationCode("");
    setPendingProposal(null);
    setResendCooldownUntilMs(0);
    syncAccountSecurityStepToUrl("add-email", null);
  }, [syncAccountSecurityStepToUrl]);

  const handleRequestEmailChallenge = useCallback(async () => {
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
      syncAccountSecurityStepToUrl("verify", response.challengeId);
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
  }, [addEmail, blockedForAuth, busy, emailValid]);

  const handleVerifyEmailChallenge = useCallback(async () => {
    if (challengeId === null || busy || blockedForAuth || !codeValid) {
      return;
    }

    setAddFeedback(null);
    setBusy(true);

    try {
      const proposal = await verifyEmailLinkChallenge(challengeId, verificationCode.trim());
      setPendingProposal(proposal);
      syncAccountSecurityStepToUrl("verify", challengeId);
      setAddFeedback({
        tone: "info",
        message: "Review the link details and confirm to add this sign-in method.",
      });
    } catch (error) {
      setAddFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }, [blockedForAuth, busy, challengeId, codeValid, verificationCode]);

  const handleConfirmProposal = useCallback(async () => {
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
      syncAccountSecurityStepToUrl(null, null);
      await refreshMethods({ preserveListFeedback: true });
    } catch (error) {
      setAddFeedback(problemToFeedback(classifySignInMethodsUnknownFailure(error)));
    } finally {
      setBusy(false);
    }
  }, [blockedForAuth, busy, pendingProposal, proposalExpired, refreshMethods]);

  const handleCancelProposal = useCallback(async () => {
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
  }, [busy, pendingProposal, resetAddFlow]);

  const handleConfirmRemove = useCallback(async () => {
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
  }, [busy, methodToRemove, refreshMethods]);

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

  return {
    buyerPolishedShell,
    methods,
    listLoaded,
    loading,
    listFeedback,
    addFeedback,
    gateProblem,
    addEmail,
    setAddEmail,
    emailTouched,
    setEmailTouched,
    challengeId,
    verificationCode,
    setVerificationCode,
    pendingProposal,
    busy,
    methodToRemove,
    setMethodToRemove,
    emailValid,
    codeValid,
    proposalRemainingMs,
    proposalExpired,
    resendCooldownMs,
    blockedForAuth,
    showRecentAuthGateCallout,
    authBlockedEmptyProps,
    accountSecuritySignInAgainHref,
    problemToFeedback,
    refreshMethods,
    resetAddFlow,
    handleRequestEmailChallenge,
    handleVerifyEmailChallenge,
    handleConfirmProposal,
    handleCancelProposal,
    handleConfirmRemove,
    setAddFeedback,
  };
}
