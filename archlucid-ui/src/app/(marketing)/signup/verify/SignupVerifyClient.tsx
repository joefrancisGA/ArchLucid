"use client";

import { CheckCircle2, Clock3, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { readLastRegistrationPayload } from "@/lib/registration-session";
import { buildSignupVerifyViewModel, type SignupVerifyIconTone } from "@/lib/signup-verify-present";
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

function SignupVerifyPhaseIcon(props: { readonly tone: SignupVerifyIconTone }): React.JSX.Element {
  const { tone } = props;

  if (tone === "success") {
    return (
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
        aria-hidden
      >
        <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
      </div>
    );
  }

  if (tone === "neutral") {
    return (
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300"
        aria-hidden
      >
        <Clock3 className="h-5 w-5" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div
      className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
      aria-hidden
    >
      <MailCheck className="h-5 w-5" strokeWidth={1.75} />
    </div>
  );
}

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
  const [cooldownTick, setCooldownTick] = useState(0);
  const [primaryBusy, setPrimaryBusy] = useState(false);
  const autoContinueRef = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastFocusedPhaseRef = useRef<string | null>(null);

  const resendCooldown = useMemo(() => readSignupVerifyResendCooldown(), [cooldownTick, resendOutcome]);

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
    let cancelled = false;

    void (async () => {
      setChecking(true);
      await refreshTrialStatus();

      if (!cancelled) {
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
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
    if (checking || lastFocusedPhaseRef.current === viewModel.phase) {
      return;
    }

    lastFocusedPhaseRef.current = viewModel.phase;
    headingRef.current?.focus();
  }, [checking, viewModel.phase]);

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

  const goToSignIn = useCallback(() => {
    router.push(buildSignupVerifySignInHref());
  }, [router]);

  const handlePrimary = useCallback(async () => {
    if (primaryBusy || viewModel.primaryDisabled) {
      return;
    }

    if (viewModel.phase === "missing_session") {
      router.push("/signup");

      return;
    }

    if (viewModel.phase === "rate_limited") {
      goToSignIn();

      return;
    }

    if (viewModel.phase === "existing_account") {
      if (isJwtAuthMode()) {
        setPrimaryBusy(true);

        try {
          await initiateOidcRedirect(SIGNUP_VERIFY_ONBOARDING_PATH);
        } catch {
          goToSignIn();
        } finally {
          setPrimaryBusy(false);
        }

        return;
      }

      goToSignIn();

      return;
    }

    if (viewModel.phase === "verification_complete") {
      continueToOnboarding();

      return;
    }

    setPrimaryBusy(true);
    setChecking(true);
    setStillPendingAfterCheck(false);

    try {
      const result = await refreshTrialStatus();

      if (result.kind === "ready") {
        continueToOnboarding();

        return;
      }

      if (result.kind === "unauthorized" && isJwtAuthMode()) {
        try {
          await initiateOidcRedirect(SIGNUP_VERIFY_ONBOARDING_PATH);
        } catch {
          goToSignIn();
        }

        return;
      }

      setStillPendingAfterCheck(true);
    } finally {
      setChecking(false);
      setPrimaryBusy(false);
    }
  }, [continueToOnboarding, goToSignIn, primaryBusy, refreshTrialStatus, router, viewModel.phase, viewModel.primaryDisabled]);

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

  const liveStatusMessage =
    viewModel.statusMessage ??
    (viewModel.phase === "resend_success" ? SIGNUP_VERIFY_PAGE_COPY.ariaResendSuccess : viewModel.heading);

  return (
    <div
      className={cn(MARKETING_SURFACES.cardComfort, "mx-auto w-full max-w-[30rem] shadow-sm")}
      data-testid="signup-verify-card"
    >
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <SignupVerifyPhaseIcon tone={viewModel.iconTone} />

        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn("text-balance outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2", MARKETING_TYPOGRAPHY.pageTitle)}
        >
          {viewModel.heading}
        </h1>

        <p className={cn("mt-3 max-w-prose text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {viewModel.body}
        </p>

        {viewModel.helperText !== null ? (
          <p className={cn("mt-3 max-w-prose text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            {viewModel.helperText}
          </p>
        ) : null}
      </div>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={SIGNUP_VERIFY_PAGE_COPY.ariaStatusRegion}
        data-testid="signup-verify-status-region"
      >
        {liveStatusMessage}
      </div>

      {viewModel.statusMessage !== null ? (
        <p
          className={cn(
            "mt-5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/60",
            MARKETING_TYPOGRAPHY.body,
          )}
          role="status"
          data-testid="signup-verify-status-message"
        >
          {viewModel.statusMessage}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          disabled={viewModel.primaryDisabled || primaryBusy}
          onClick={() => void handlePrimary()}
          data-testid="signup-verify-continue-onboarding"
        >
          {primaryBusy && viewModel.phase !== "missing_session" && viewModel.phase !== "rate_limited"
            ? SIGNUP_VERIFY_PAGE_COPY.primaryContinueChecking
            : viewModel.primaryLabel}
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

      <div className="mt-6 flex flex-col gap-2.5 text-center sm:text-left">
        {viewModel.showDifferentEmail ? (
          <Link
            href="/signup"
            className={cn(MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta, "font-medium")}
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
            className={cn(
              MARKETING_SURFACES.inlineLink,
              MARKETING_TYPOGRAPHY.body,
              "font-medium text-al-text-primary underline-offset-4 hover:underline",
            )}
            data-testid="signup-verify-sign-in"
          >
            {viewModel.signInLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
