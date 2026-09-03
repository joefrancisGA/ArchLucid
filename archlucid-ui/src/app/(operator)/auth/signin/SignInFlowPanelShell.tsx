"use client";

import { SignInCodeStep } from "@/app/(operator)/auth/signin/SignInCodeStep";
import { SignInEmailStep } from "@/app/(operator)/auth/signin/SignInEmailStep";
import { SignInMethodPicker } from "@/app/(operator)/auth/signin/SignInMethodPicker";
import { SignInSsoRequiredStep } from "@/app/(operator)/auth/signin/SignInSsoRequiredStep";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer/buyer-safe-auth-messages";

import type { SignInFlowState } from "./use-sign-in-flow-state";

export type SignInFlowPanelShellProps = SignInFlowState;

export function SignInFlowPanelShell(props: SignInFlowPanelShellProps): React.JSX.Element {
  const {
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
  } = props;

  if (fatalError) {
    return (
      <AuthFlowShell hasReturnDestination={hasReturnDestination}>
        <AuthErrorPanel message={fatalError} />
      </AuthFlowShell>
    );
  }

  if (!hasAnySignInMethod) {
    return (
      <AuthFlowShell hasReturnDestination={hasReturnDestination}>
        <AuthErrorPanel message={BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE} />
      </AuthFlowShell>
    );
  }

  if (step === "options") {
    return (
      <AuthFlowShell hasReturnDestination={hasReturnDestination}>
        <SignInMethodPicker
          options={methodOptions}
          onWorkSchool={beginWorkSchool}
          onEmailCode={handleBeginEmailCode}
          onSupplemental={beginSupplemental}
        />
      </AuthFlowShell>
    );
  }

  if (step === "email") {
    return (
      <AuthFlowShell hasReturnDestination={hasReturnDestination}>
        <SignInEmailStep
          email={email}
          pending={emailPending}
          errorMessage={emailError}
          statusMessage={emailStatus}
          onEmailChange={setEmail}
          onSubmit={handleEmailSubmit}
          onBack={resetEmailOtpFlow}
          onBotChallengeTokenChange={turnstileRequired ? handleBotChallengeTokenChange : undefined}
        />
      </AuthFlowShell>
    );
  }

  if (step === "sso") {
    return (
      <AuthFlowShell hasReturnDestination={hasReturnDestination}>
        <SignInSsoRequiredStep
          message={ssoMessage}
          onContinueOrganizationSignIn={beginWorkSchool}
          onUseAnotherEmail={handleUseAnotherEmailFromSso}
        />
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell hasReturnDestination={hasReturnDestination}>
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
        onDifferentEmail={handleDifferentEmail}
        onBotChallengeTokenChange={turnstileRequired ? handleBotChallengeTokenChange : undefined}
      />
    </AuthFlowShell>
  );
}
