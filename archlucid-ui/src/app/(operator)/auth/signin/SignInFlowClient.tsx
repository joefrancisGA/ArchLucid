"use client";

import { SignInFlowPanelShell } from "@/app/(operator)/auth/signin/SignInFlowPanelShell";
import { useSignInFlowState } from "@/app/(operator)/auth/signin/use-sign-in-flow-state";

export type { SignInFlowStep } from "@/app/(operator)/auth/signin/use-sign-in-flow-state";

export type SignInFlowClientProps = {
  readonly returnUrl?: string;
  readonly invitationTokenFromQuery?: string | null;
};

export function SignInFlowClient({ returnUrl, invitationTokenFromQuery }: SignInFlowClientProps) {
  const model = useSignInFlowState({ returnUrl, invitationTokenFromQuery });

  return <SignInFlowPanelShell {...model} />;
}
