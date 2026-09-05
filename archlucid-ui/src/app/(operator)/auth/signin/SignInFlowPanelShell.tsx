"use client";

import { SignInCodeStep } from "@/app/(operator)/auth/signin/SignInCodeStep";
import { SignInEmailStep } from "@/app/(operator)/auth/signin/SignInEmailStep";
import { SignInMethodPicker } from "@/app/(operator)/auth/signin/SignInMethodPicker";
import { SignInSsoRequiredStep } from "@/app/(operator)/auth/signin/SignInSsoRequiredStep";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { SignInBuyerChrome } from "@/app/(operator)/auth/signin/SignInBuyerChrome";
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
      <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
        <AuthErrorPanel message={fatalError} />
      </SignInBuyerChrome>
    );
  }

  if (!hasAnySignInMethod) {
    return (
      <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
        <AuthErrorPanel message={BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE} />
      </SignInBuyerChrome>
    );
  }

  if (step === "options") {
    return (
      <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
        <SignInMethodPicker
          options={methodOptions}
          onWorkSchool={beginWorkSchool}
          onEmailCode={handleBeginEmailCode}
          onSupplemental={beginSupplemental}
        />
      </SignInBuyerChrome>
    );
  }

  if (step === "email") {
    return (
      <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
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
      </SignInBuyerChrome>
    );
  }

  if (step === "sso") {
    return (
      <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
        <SignInSsoRequiredStep
          message={ssoMessage}
          onContinueOrganizationSignIn={beginWorkSchool}
          onUseAnotherEmail={handleUseAnotherEmailFromSso}
        />
      </SignInBuyerChrome>
    );
  }

  return (
    <SignInBuyerChrome hasReturnDestination={hasReturnDestination}>
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
    </SignInBuyerChrome>
  );
}
