import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { DIGESTS_PAGE_TITLE } from "@/lib/digests-browse-copy";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export default function DigestsPage() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Digest delivery"
        description="In a connected tenant, architects configure scheduled governance digests and notification subscriptions."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <h1
            className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid="digests-page-title"
          >
            {DIGESTS_PAGE_TITLE}
          </h1>
          <p
            className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="digests-hub-suspense-fallback"
          >
            Loading digests…
          </p>
        </header>
      }
    >
      <DigestsHubClient />
    </Suspense>
  );
}
