import { Suspense } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

export default function DigestsPage() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Digest delivery"
        description="Scheduled governance digests and notification subscriptions are available in a connected tenant."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-neutral-500 dark:text-neutral-400" data-testid="digests-hub-suspense-fallback">
          Loading digests...
        </p>
      }
    >
      <DigestsHubClient />
    </Suspense>
  );
}
