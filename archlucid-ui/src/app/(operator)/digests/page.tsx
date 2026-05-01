import { Suspense } from "react";

import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

export default function DigestsPage() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Digests not available in demo mode.</p>
        <p className="m-0 mt-1">Digest delivery and subscriptions are available with a live API connection.</p>
      </div>
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
