import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

export default function AlertRulesPage() {
  return (
    <Suspense
      fallback={
        <p
          className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-rules-hub-suspense-fallback"
        >
          Loading alert rules…
        </p>
      }
    >
      <AlertRulesHubClient />
    </Suspense>
  );
}
