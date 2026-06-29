import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AlertsHubClient } from "./AlertsHubClient";

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <p
          className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alerts-hub-suspense-fallback"
        >
          Loading alerts…
        </p>
      }
    >
      <AlertsHubClient />
    </Suspense>
  );
}
