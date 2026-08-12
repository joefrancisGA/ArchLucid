import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { Suspense } from "react";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";

function ItsmOAuthCallbackLoading(): React.ReactElement {
  return (
    <AuthFlowShell showEvaluationSignupLink={false}>
      <ItsmAtlassianOAuthCallbackLoadingView />
    </AuthFlowShell>
  );
}

export default function ItsmAtlassianOAuthCallbackPage(): React.ReactElement {
  return (
    <Suspense fallback={<ItsmOAuthCallbackLoading />}>
      <ItsmAtlassianOAuthCallbackClient />
    </Suspense>
  );
}
