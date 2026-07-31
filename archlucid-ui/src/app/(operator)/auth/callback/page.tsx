import { Suspense } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { CallbackClient } from "@/app/(operator)/auth/callback/CallbackClient";
import { AuthCallbackLoadingView } from "@/app/(operator)/auth/callback/AuthCallbackLoadingView";

function AuthCallbackLoading() {
  return (
    <AuthFlowShell>
      <AuthCallbackLoadingView />
    </AuthFlowShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <CallbackClient />
    </Suspense>
  );
}
