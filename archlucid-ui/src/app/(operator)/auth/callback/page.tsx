import { Suspense } from "react";

import { AuthCallbackBuyerChrome } from "@/app/(operator)/auth/callback/AuthCallbackBuyerChrome";
import { CallbackClient } from "@/app/(operator)/auth/callback/CallbackClient";
import { AuthCallbackLoadingView } from "@/app/(operator)/auth/callback/AuthCallbackLoadingView";

function AuthCallbackLoading(): React.JSX.Element {
  return (
    <AuthCallbackBuyerChrome>
      <AuthCallbackLoadingView />
    </AuthCallbackBuyerChrome>
  );
}

export default function AuthCallbackPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <CallbackClient />
    </Suspense>
  );
}
