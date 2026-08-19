"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { readLastRegistrationPayload } from "@/lib/registration-session";
import { buildSignupVerifyViewModel } from "@/lib/signup-verify-present";
import { SIGNUP_VERIFY_PAGE_COPY } from "@/lib/signup-verify-page-copy";
import {
  buildSignupVerifySignInHref,
  SIGNUP_VERIFY_ONBOARDING_PATH,
} from "@/lib/signup-verify-navigation";
import {
  markSignupVerifyResendSent,
  readSignupVerifyResendCooldown,
} from "@/lib/signup-verify-resend";
import {
  fetchSignupVerifyTrialStatus,
  type SignupVerifyTrialStatusResult,
} from "@/lib/signup-verify-trial-status";
import { cn } from "@/lib/utils";

const STATUS_POLL_MS = 25_000;
const AUTO_CONTINUE_MS = 2_500;

/**
 * Post-registration email verification handoff. Uses registration session scope and trial-status when available
 * to decide whether onboarding can continue; never surfaces internal auth or API implementation details.
 */
export function SignupVerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email")?.trim() ?? "";

  const [registration, setRegistration] = useState(readLastRegistrationPayload);
  const [trialStatus, setTrialStatus] = useState<SignupVerifyTrialStatusResult | null>(null);
  const [checking, setChecking] = useState(true);
  const [stillPendingAfterCheck, setStillPendingAfterCheck] = useState(false);
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendOutcome, setResendOutcome] = useState<"success" | "failed" | null>(null);
  const [, setCooldownTick] = useState(0);
  const autoContinueRef = useRef<number | null>(null);

  const resendCooldown = readSignupVerifyResendCooldown();

  const refreshTrialStatus = useCallback(async (): Promise<SignupVerifyTrialStatusResult> => {
    const result = await fetchSignupVerifyTrialStatus();
    setTrialStatus(result);

    if (result.kind === "error") {
      setInitialLoadFailed(true);
    }

    return result;
  }, []);

  useEffect(() => {
    setRegistration(readLastRegistrationPayload());
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setChecking(true);
      await refreshTrialStatus();

      if (!canceled) {
        setChecking(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [refreshTrialStatus]);

  useEffect(() => {
    if (checking) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCooldownTick((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checking]);

  useEffect(() => {
    if (checking || trialStatus?.kind !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshTrialStatus();
    }, STATUS_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checking, refreshTrialStatus, trialStatus?.kind]);

  const viewModel = buildSignupVerifyViewModel({
    registration,
    queryEmail,
    trialStatus,
    resendCooldown,
    checking,
    resendPending,
    resendOutcome,
    stillPendingAfterCheck,
    initialLoadFailed,
  });

  useEffect(() => {
    if (!viewModel.autoContinue) {
      return;
    }

    autoContinueRef.current = window.setTimeout(() => {
      router.replace(SIGNUP_VERIFY_ONBOARDING_PATH);
    }, AUTO_CONTINUE_MS);

    return () => {
      if (autoContinueRef.current !== null) {
        window.clearTimeout(autoContinueRef.current);
        autoContinueRef.current = null;
      }
    };
  }, [router, viewModel.autoContinue]);

  const continueToOnboarding = useCallback(() => {
    router.push(SIGNUP_VERIFY_ONBOARDING_PATH);
  }, [router]);

  const handlePrimary = useCallback(async () => {
    if (viewModel.phase === "missing_session") {
      router.push("/signup");

      return;
    }

    if (viewModel.phase === "existing_account") {
      if (isJwtAuthMode()) {
        try {
          await initiateOidcRedirect(SIGNUP_VERIFY_ONBOARDING_PATH);
        } catch {
          router.push(buildSignupVerifySignInHref());
        }

        return;
      }

      router.push(buildSignupVerifySignInHref());

      return;
    }

    if (viewModel.phase === "verification_complete") {
      continueToOnboarding();

      return;
    }

    setChecking(true);
    setStillPendingAfterCheck(false);
    const result = await refreshTrialStatus();
    setChecking(false);

    if (result.kind === "ready") {
      continueToOnboarding();

      return;
    }

    if (result.kind === "unauthorized" && isJwtAuthMode()) {
      try {
        await initiateOidcRedirect(SIGNUP_VERIFY_ONBOARDING_PATH);
      } catch {
        router.push(buildSignupVerifySignInHref());
      }

      return;
    }

    setStillPendingAfterCheck(true);
  }, [continueToOnboarding, refreshTrialStatus, router, viewModel.phase]);

  const handleResend = useCallback(async () => {
    if (resendCooldown.active || resendPending) {
      return;
    }

    setResendPending(true);
    setResendOutcome(null);
    setStillPendingAfterCheck(false);

    try {
      markSignupVerifyResendSent();

      if (isJwtAuthMode()) {
        await initiateOidcRedirect(SIGNUP_VERIFY_ONBOARDING_PATH);
        setResendOutcome("success");

        return;
      }

      setResendOutcome("success");
      await refreshTrialStatus();
    } catch {
      setResendOutcome("failed");
    } finally {
      setResendPending(false);
      setCooldownTick((value) => value + 1);
    }
  }, [refreshTrialStatus, resendCooldown.active, resendPending]);

  return (
    <div
      className={cn(MARKETING_SURFACES.cardComfort, "mx-auto w-full max-w-md shadow-sm")}
      data-testid="signup-verify-card"
    >
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
          aria-hidden
        >
          <MailCheck className="h-5 w-5" strokeWidth={1.75} />
        </div>

        <h1 className={cn("text-balance", MARKETING_TYPOGRAPHY.pageTitle)}>{viewModel.heading}</h1>

        <p className={cn("mt-3 text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{viewModel.body}</p>

        {viewModel.helperText !== null ? (
          <p className={cn("mt-3 text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{viewModel.helperText}</p>
        ) : null}
      </div>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="signup-verify-status-region"
      >
        {viewModel.statusMessage ?? viewModel.heading}
      </div>

      {viewModel.statusMessage !== null ? (
        <p
          className={cn("mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/60", MARKETING_TYPOGRAPHY.body)}
          role="status"
          data-testid="signup-verify-status-message"
        >
          {viewModel.statusMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          disabled={viewModel.primaryDisabled}
          onClick={() => void handlePrimary()}
          data-testid="signup-verify-continue-onboarding"
        >
          {viewModel.primaryLabel}
        </Button>

        {viewModel.showResend ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={viewModel.resendDisabled}
            onClick={() => void handleResend()}
            data-testid="signup-verify-resend-email"
          >
            {viewModel.resendLabel}
          </Button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2 text-center sm:text-left">
        {viewModel.showDifferentEmail ? (
          <Link
            href="/signup"
            className={cn(MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}
            data-testid="signup-verify-different-email"
          >
            {SIGNUP_VERIFY_PAGE_COPY.secondaryDifferentEmail}
          </Link>
        ) : null}

        {viewModel.showReturnSignup ? (
          <Link
            href="/signup"
            className={cn(MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}
            data-testid="signup-verify-return-signup"
          >
            {SIGNUP_VERIFY_PAGE_COPY.secondaryReturnSignup}
          </Link>
        ) : null}

        {viewModel.showSignIn ? (
          <Link
            href={buildSignupVerifySignInHref()}
            className={cn(MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}
            data-testid="signup-verify-sign-in"
          >
            {SIGNUP_VERIFY_PAGE_COPY.secondarySignIn}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
