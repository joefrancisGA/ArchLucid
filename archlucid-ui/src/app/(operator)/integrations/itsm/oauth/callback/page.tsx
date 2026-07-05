import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function ItsmOAuthCallbackLoading(): React.ReactElement {
  return (
    <div className="max-w-[640px]">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Atlassian connector consent</h2>
      <p role="status" aria-live="polite" className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Completing Atlassian consent…
      </p>
    </div>
  );
}

export default function ItsmAtlassianOAuthCallbackPage(): React.ReactElement {
  return (
    <Suspense fallback={<ItsmOAuthCallbackLoading />}>
      <ItsmAtlassianOAuthCallbackClient />
    </Suspense>
  );
}
