"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SignInCodeStep } from "@/app/(operator)/auth/signin/SignInCodeStep";
import { SignInEmailStep } from "@/app/(operator)/auth/signin/SignInEmailStep";
import { SignInMethodPicker } from "@/app/(operator)/auth/signin/SignInMethodPicker";
import { SignInSsoRequiredStep } from "@/app/(operator)/auth/signin/SignInSsoRequiredStep";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { recordEmailOtpAuthAnalytics } from "@/lib/auth/email-otp-analytics";
import { requestEmailOtpChallenge, verifyEmailOtpCode } from "@/lib/auth/email-otp-api";
import { resolveEmailOtpPostAuthPath } from "@/lib/auth/email-otp-post-auth";
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
import {
  mapEmailOtpFailureToCustomerMessage,
  SIGN_IN_PAGE_COPY,
} from "@/lib/auth/sign-in-page-copy";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer-safe-auth-messages";
import { resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { assertOidcSignInConfig } from "@/lib/oidc/config";
import { initiateOidcRedirect, initiateSupplementalOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { isLikelySignedIn, persistTokenResponse } from "@/lib/oidc/session";
import { maskEmailForDisplay } from "@/lib/signup-verify-email";

export type SignInFlowStep = "options" | "email" | "code" | "sso";

export type SignInFlowClientProps = {
  readonly returnUrl?: string;
  readonly invitationTokenFromQuery?: string | null;
};

export function SignInFlowClient({ returnUrl, invitationTokenFromQuery }: SignInFlowClientProps) {
  const safeReturnUrl = useMemo(() => resolveSafeReturnPath(returnUrl, "/"), [returnUrl]);
  const methodOptions = useMemo(() => resolveSignInMethodOptions(), []);

  const restoredSession = useMemo(() => readEmailOtpChallengeSession(), []);
  const initialStep: SignInFlowStep = restoredSession ? "code" : "options";

  const [step, setStep] = useState<SignInFlowStep>(initialStep);
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
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [resendSecondsRemaining, setResendSecondsRemaining] = useState(
    () => readEmailOtpResendCooldown().secondsRemaining,
  );

  const submitLockRef = useRef(false);

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
    setStep("options");
  }, []);

  const applyChallengeSuccess = useCallback(
    (normalizedEmail: string, responseChallengeId: string | null | undefined, ssoRequired: boolean) => {
      const masked = maskEmailForDisplay(normalizedEmail);
      const displayMasked = masked.length > 0 ? masked : "your email address";

      if (ssoRequired) {
        setEmail(normalizedEmail);
        setMaskedEmail(displayMasked);
        recordEmailOtpAuthAnalytics("email_otp_sso_redirect_required");
        setStep("sso");

        return;
      }

      const nextChallengeId = responseChallengeId?.trim() ?? null;

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
      const result = await requestEmailOtpChallenge(targetEmail.trim(), invitationToken);

      setEmailPending(false);
      setResendPending(false);
      submitLockRef.current = false;

      if (result.kind === "failure") {
        recordEmailOtpAuthAnalytics("email_otp_failure", { failureCategory: result.category });

        if (step === "code") {
          setCodeError(mapEmailOtpFailureToCustomerMessage(result.category));
        } else {
          setEmailError(mapEmailOtpFailureToCustomerMessage(result.category));
        }

        return;
      }

      applyChallengeSuccess(targetEmail, result.response.challengeId, result.response.ssoRequired);
    },
    [applyChallengeSuccess, step],
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

    clearEmailOtpChallengeSession();
    setCode("");

    recordEmailOtpAuthAnalytics("email_otp_verification_completed", {
      nextStep: tokenResponse.nextStep,
    });

    const destination = resolveEmailOtpPostAuthPath(tokenResponse.nextStep, safeReturnUrl);

    window.location.replace(destination);
  }, [challengeId, code, codePending, safeReturnUrl]);

  if (fatalError) {
    return <AuthErrorPanel message={fatalError} />;
  }

  if (!hasAnySignInMethod) {
    return <AuthErrorPanel message={BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE} />;
  }

  if (step === "options") {
    return (
      <SignInMethodPicker
        options={methodOptions}
        onWorkSchool={beginWorkSchool}
        onEmailCode={() => {
          setStep("email");
          setEmailError(null);
          setEmailStatus(null);
        }}
        onSupplemental={beginSupplemental}
      />
    );
  }

  if (step === "email") {
    return (
      <SignInEmailStep
        email={email}
        pending={emailPending}
        errorMessage={emailError}
        statusMessage={emailStatus}
        onEmailChange={setEmail}
        onSubmit={handleEmailSubmit}
        onBack={resetEmailOtpFlow}
      />
    );
  }

  if (step === "sso") {
    return (
      <SignInSsoRequiredStep
        onContinueOrganizationSignIn={beginWorkSchool}
        onUseAnotherEmail={() => {
          clearEmailOtpChallengeSession();
          setStep("email");
          setEmailError(null);
          setEmailStatus(null);
        }}
      />
    );
  }

  return (
    <SignInCodeStep
      maskedEmail={maskedEmail}
      code={code}
      pending={codePending}
      resendPending={resendPending}
      resendSecondsRemaining={resendSecondsRemaining}
      errorMessage={codeError}
      statusMessage={codeStatus}
      onCodeChange={setCode}
      onSubmit={() => {
        void handleCodeSubmit();
      }}
      onResend={() => {
        void sendChallenge(email);
      }}
      onDifferentEmail={() => {
        clearEmailOtpChallengeSession();
        setCode("");
        setCodeError(null);
        setCodeStatus(null);
        setStep("email");
      }}
    />
  );
}
