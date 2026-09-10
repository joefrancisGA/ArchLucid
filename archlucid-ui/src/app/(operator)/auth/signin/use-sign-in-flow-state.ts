"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { evaluateAuthSignInRouting } from "@/lib/auth/auth-sign-in-routing-api";
import { recordEmailOtpAuthAnalytics } from "@/lib/auth/email-otp-analytics";
import { requestEmailOtpChallenge, verifyEmailOtpCode } from "@/lib/auth/email-otp-api";
import { resolveEmailOtpPostAuthPath } from "@/lib/auth/email-otp-post-auth";
import { restoreIdleDeskScopeAfterSignIn } from "@/lib/auth/idle-desk-restore";
import {
  markEmailOtpResendSent,
  readEmailOtpResendCooldown,
} from "@/lib/auth/email-otp-resend";
import {
  clearEmailOtpChallengeSession,
  readEmailOtpChallengeSession,
  readInvitationToken,
  storeEmailOtpChallengeSession,
  storeInvitationToken,
} from "@/lib/auth/email-otp-session";
import { resolveSignInMethodOptions } from "@/lib/auth/sign-in-method-options";
import { isTurnstileBotChallengeConfigured } from "@/lib/auth/turnstile-config";
import {
  mapEmailOtpFailureToCustomerMessage,
  SIGN_IN_PAGE_COPY,
} from "@/lib/auth/sign-in-page-copy";
import { resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { signInHasReturnDestination } from "@/lib/auth/sign-in-return-destination";
import { assertOidcSignInConfig } from "@/lib/oidc/config";
import { initiateOidcRedirect, initiateSupplementalOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { isLikelySignedIn, persistTokenResponse } from "@/lib/oidc/session";
import { maskEmailForDisplay } from "@/lib/signup-verify-email";
import {
  parseSignInFlowStepFromSearch,
  signInFlowStepHrefFromSearch,
  type SignInFlowStepUrlValue,
} from "@/lib/auth/sign-in-flow-step-url";

export type SignInFlowStep = "options" | "email" | "code" | "sso";

export type UseSignInFlowStateProps = {
  readonly returnUrl?: string;
  readonly invitationTokenFromQuery?: string | null;
};

export function useSignInFlowState({ returnUrl, invitationTokenFromQuery }: UseSignInFlowStateProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/auth/signin";
  const searchParams = useSearchParams();
  const safeReturnUrl = useMemo(() => resolveSafeReturnPath(returnUrl, "/"), [returnUrl]);
  const hasReturnDestination = useMemo(() => signInHasReturnDestination(returnUrl), [returnUrl]);
  const methodOptions = useMemo(() => resolveSignInMethodOptions(), []);

  const restoredSession = useMemo(() => readEmailOtpChallengeSession(), []);
  const urlStep = parseSignInFlowStepFromSearch(searchParams.get("step"));
  const initialStep: SignInFlowStep = urlStep ?? (restoredSession ? "code" : "options");

  const [step, setStepState] = useState<SignInFlowStep>(initialStep);

  const syncStepToUrl = useCallback(
    (nextStep: SignInFlowStep) => {
      router.replace(
        signInFlowStepHrefFromSearch(searchParams.toString(), nextStep as SignInFlowStepUrlValue, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setStep = useCallback(
    (nextStep: SignInFlowStep) => {
      setStepState(nextStep);
      syncStepToUrl(nextStep);
    },
    [syncStepToUrl],
  );

  useEffect(() => {
    const fromUrl = parseSignInFlowStepFromSearch(searchParams.get("step"));

    if (fromUrl !== null) {
      setStepState(fromUrl);
    }
  }, [searchParams]);
  const [email, setEmail] = useState(restoredSession?.email ?? "");
  const [maskedEmail, setMaskedEmail] = useState(restoredSession?.maskedEmail ?? "");
  const [challengeId, setChallengeId] = useState<string | null>(restoredSession?.challengeId ?? null);
  const [code, setCode] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [codePending, setCodePending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [ssoMessage, setSsoMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [resendSecondsRemaining, setResendSecondsRemaining] = useState(
    () => readEmailOtpResendCooldown().secondsRemaining,
  );
  const [botChallengeToken, setBotChallengeToken] = useState<string | null>(null);

  const submitLockRef = useRef(false);
  const turnstileRequired = useMemo(() => isTurnstileBotChallengeConfigured(), []);
  const handleBotChallengeTokenChange = useCallback((token: string | null) => {
    setBotChallengeToken(token);
  }, []);

  useEffect(() => {
    if (invitationTokenFromQuery && invitationTokenFromQuery.trim().length > 0) {
      storeInvitationToken(invitationTokenFromQuery);
    }
  }, [invitationTokenFromQuery]);

  useEffect(() => {
    if (isLikelySignedIn()) {
      window.location.replace(safeReturnUrl);
    }
  }, [safeReturnUrl]);

  useEffect(() => {
    if (step !== "code") {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSecondsRemaining(readEmailOtpResendCooldown().secondsRemaining);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [step]);

  const hasAnySignInMethod = methodOptions.workSchool || methodOptions.emailCode;

  const beginWorkSchool = useCallback(() => {
    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      setFatalError(cfg.message);

      return;
    }

    void initiateOidcRedirect(safeReturnUrl !== "/" ? safeReturnUrl : undefined).catch((error: unknown) => {
      setFatalError(error instanceof Error ? error.message : String(error));
    });
  }, [safeReturnUrl]);

  const beginSupplemental = useCallback(
    (provider: "microsoft" | "google") => {
      if (provider === "microsoft") {
        beginWorkSchool();

        return;
      }

      void initiateSupplementalOidcRedirect("google", safeReturnUrl !== "/" ? safeReturnUrl : undefined).catch(
        (error: unknown) => {
          setFatalError(error instanceof Error ? error.message : String(error));
        },
      );
    },
    [beginWorkSchool, safeReturnUrl],
  );

  const resetEmailOtpFlow = useCallback(() => {
    clearEmailOtpChallengeSession();
    setEmail("");
    setMaskedEmail("");
    setChallengeId(null);
    setCode("");
    setEmailError(null);
    setCodeError(null);
    setEmailStatus(null);
    setCodeStatus(null);
    setSsoMessage(null);
    setStep("options");
  }, []);

  const applyChallengeSuccess = useCallback(
    (
      normalizedEmail: string,
      responseChallengeId: string | null | undefined,
      ssoRequired: boolean,
      nextSsoMessage?: string | null,
    ) => {
      const masked = maskEmailForDisplay(normalizedEmail);
      const displayMasked = masked.length > 0 ? masked : "your email address";

      if (ssoRequired) {
        setEmail(normalizedEmail);
        setMaskedEmail(displayMasked);
        setSsoMessage(nextSsoMessage?.trim() || null);
        recordEmailOtpAuthAnalytics("email_otp_sso_redirect_required");
        setStep("sso");

        return;
      }

      const nextChallengeId = responseChallengeId?.trim() ?? null;

      if (nextChallengeId === null || nextChallengeId.length === 0) {
        setEmail(normalizedEmail);
        setEmailError(null);
        setEmailStatus(SIGN_IN_PAGE_COPY.codeSentAnnouncement);
        recordEmailOtpAuthAnalytics("email_otp_code_requested");

        return;
      }

      storeEmailOtpChallengeSession(nextChallengeId, displayMasked, normalizedEmail);
      markEmailOtpResendSent();
      setEmail(normalizedEmail);
      setMaskedEmail(displayMasked);
      setChallengeId(nextChallengeId);
      setCode("");
      setCodeError(null);
      setCodeStatus(SIGN_IN_PAGE_COPY.codeSentAnnouncement);
      recordEmailOtpAuthAnalytics("email_otp_code_requested");
      setStep("code");
    },
    [],
  );

  const sendChallenge = useCallback(
    async (targetEmail: string) => {
      if (submitLockRef.current) {
        return;
      }

      submitLockRef.current = true;
      setEmailPending(true);
      setResendPending(true);
      setEmailError(null);
      setEmailStatus(null);
      setCodeError(null);

      const invitationToken = readInvitationToken();
      const trimmedEmail = targetEmail.trim();

      if (turnstileRequired && (botChallengeToken === null || botChallengeToken.length === 0)) {
        setEmailPending(false);
        setResendPending(false);
        submitLockRef.current = false;

        if (step === "code") {
          setCodeError(mapEmailOtpFailureToCustomerMessage("unknown"));
        } else {
          setEmailError(mapEmailOtpFailureToCustomerMessage("unknown"));
        }

        return;
      }

      const routingPreview = await evaluateAuthSignInRouting(trimmedEmail, invitationToken, safeReturnUrl);

      if (routingPreview?.ssoRequired) {
        setEmailPending(false);
        setResendPending(false);
        submitLockRef.current = false;
        applyChallengeSuccess(trimmedEmail, null, true, routingPreview.message);

        return;
      }

      const result = await requestEmailOtpChallenge(trimmedEmail, invitationToken, botChallengeToken);

      setEmailPending(false);
      setResendPending(false);
      submitLockRef.current = false;
      setBotChallengeToken(null);

      if (result.kind === "failure") {
        recordEmailOtpAuthAnalytics("email_otp_failure", { failureCategory: result.category });

        if (step === "code") {
          setCodeError(mapEmailOtpFailureToCustomerMessage(result.category));
        } else {
          setEmailError(mapEmailOtpFailureToCustomerMessage(result.category));
        }

        return;
      }

      applyChallengeSuccess(
        targetEmail,
        result.response.challengeId,
        result.response.ssoRequired,
        result.response.ssoMessage,
      );
    },
    [applyChallengeSuccess, botChallengeToken, safeReturnUrl, step, turnstileRequired],
  );

  const handleEmailSubmit = useCallback(() => {
    void sendChallenge(email);
  }, [email, sendChallenge]);

  const handleCodeSubmit = useCallback(async () => {
    if (submitLockRef.current || codePending) {
      return;
    }

    if (challengeId === null || challengeId.length === 0) {
      setCodeError(mapEmailOtpFailureToCustomerMessage("unknown"));

      return;
    }

    submitLockRef.current = true;
    setCodePending(true);
    setCodeError(null);

    const invitationToken = readInvitationToken();
    const result = await verifyEmailOtpCode(challengeId, code.trim(), invitationToken);

    if (result.kind === "failure") {
      recordEmailOtpAuthAnalytics("email_otp_failure", { failureCategory: result.category });
      setCodeError(mapEmailOtpFailureToCustomerMessage(result.category));
      setCodePending(false);
      submitLockRef.current = false;

      return;
    }

    const tokenResponse = result.response;

    persistTokenResponse({
      access_token: tokenResponse.accessToken,
      expires_in: tokenResponse.expiresInSeconds,
      token_type: tokenResponse.tokenType,
    });
    restoreIdleDeskScopeAfterSignIn();

    clearEmailOtpChallengeSession();
    setCode("");

    recordEmailOtpAuthAnalytics("email_otp_verification_completed", {
      nextStep: tokenResponse.nextStep,
    });

    const destination = resolveEmailOtpPostAuthPath(tokenResponse.nextStep, safeReturnUrl);

    window.location.replace(destination);
  }, [challengeId, code, codePending, safeReturnUrl]);

  const handleDifferentEmail = useCallback(() => {
    clearEmailOtpChallengeSession();
    setCode("");
    setCodeError(null);
    setCodeStatus(null);
    setBotChallengeToken(null);
    setStep("email");
  }, []);

  const handleUseAnotherEmailFromSso = useCallback(() => {
    clearEmailOtpChallengeSession();
    setStep("email");
    setEmailError(null);
    setEmailStatus(null);
  }, []);

  const handleBeginEmailCode = useCallback(() => {
    setStep("email");
    setEmailError(null);
    setEmailStatus(null);
  }, []);

  return {
    hasReturnDestination,
    methodOptions,
    step,
    email,
    setEmail,
    maskedEmail,
    code,
    setCode,
    emailPending,
    codePending,
    resendPending,
    emailError,
    codeError,
    emailStatus,
    codeStatus,
    ssoMessage,
    fatalError,
    resendSecondsRemaining,
    turnstileRequired,
    handleBotChallengeTokenChange,
    hasAnySignInMethod,
    beginWorkSchool,
    beginSupplemental,
    resetEmailOtpFlow,
    handleEmailSubmit,
    handleCodeSubmit,
    sendChallenge,
    handleDifferentEmail,
    handleUseAnotherEmailFromSso,
    handleBeginEmailCode,
  };
}

export type SignInFlowState = ReturnType<typeof useSignInFlowState>;
