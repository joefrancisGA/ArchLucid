import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { cn } from "@/lib/utils";
import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { cn } from "@/lib/utils";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export default function DigestsPage() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Digest delivery"
        description="In a connected tenant, operators configure scheduled governance digests and notification subscriptions."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <p
          className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="digests-hub-suspense-fallback"
        >
          Loading digests...
        </p>
      }
    >
      <DigestsHubClient />
    </Suspense>
  );
}
