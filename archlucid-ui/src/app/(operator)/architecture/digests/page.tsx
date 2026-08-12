import { Suspense } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { DIGESTS_PAGE_TITLE } from "@/lib/digests-browse-copy";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

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
        <OperatorPageHeader
          title={DIGESTS_PAGE_TITLE}
          titleTestId="digests-page-title"
          headingLevel="h1"
          subtitle="Loading digests…"
          subtitleTestId="digests-hub-suspense-fallback"
        />
      }
    >
      <DigestsHubClient />
    </Suspense>
  );
}
