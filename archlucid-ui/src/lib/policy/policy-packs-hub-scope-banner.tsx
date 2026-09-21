"use client";

import { useSyncExternalStore } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import { cn } from "@/lib/utils";

function subscribeScopeLabel(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onStoreChange();
  window.addEventListener("archlucid:operator-scope-changed", handler);

  return () => window.removeEventListener("archlucid:operator-scope-changed", handler);
}

function readScopeLabelSnapshot(): string {
  return readActiveWorkspaceScopeLabel();
}

/** Shows the resolved tenant/workspace scope for policy pack inventory and effective merge. */
export function PolicyPacksHubScopeBanner(): React.JSX.Element {
  const scopeLabel = useSyncExternalStore(subscribeScopeLabel, readScopeLabelSnapshot, () => readScopeLabelSnapshot());

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="policy-packs-resolved-scope-banner"
    >
      Resolved scope: <span className="font-medium text-al-text-primary">{scopeLabel}</span>
    </p>
  );
}
