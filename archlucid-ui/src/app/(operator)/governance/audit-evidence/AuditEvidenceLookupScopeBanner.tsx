"use client";

import { useSyncExternalStore } from "react";

import { AUDIT_EVIDENCE_LOOKUP_SCOPE_BANNER_PREFIX } from "@/lib/audit-evidence-page-copy";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

/** Shows the active workspace scope for audit evidence lookup (tenant-scoped lineage). */
export function AuditEvidenceLookupScopeBanner(): React.JSX.Element {
  const scopeLabel = useSyncExternalStore(subscribeScopeLabel, readScopeLabelSnapshot, () => readScopeLabelSnapshot());

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="audit-evidence-lookup-scope-banner"
    >
      {AUDIT_EVIDENCE_LOOKUP_SCOPE_BANNER_PREFIX}{" "}
      <span className="font-medium text-al-text-primary">{scopeLabel}</span>
    </p>
  );
}
