"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  AUDIT_EVIDENCE_LOOKUP_CHANGE_SCOPE_ACTION,
  AUDIT_EVIDENCE_LOOKUP_SCOPE_PREFIX,
} from "@/lib/audit-evidence-page-copy";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WORKSPACE_SCOPE_SWITCHER_HREF } from "@/lib/vocabulary/workspace-scope-tenant-settings-vocabulary";
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
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="audit-evidence-lookup-scope-banner"
    >
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {AUDIT_EVIDENCE_LOOKUP_SCOPE_PREFIX}
      </span>
      <StatusTag kind="neutral" label={scopeLabel} data-testid="audit-evidence-lookup-scope-chip" />
      <Link
        href={WORKSPACE_SCOPE_SWITCHER_HREF}
        className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid="audit-evidence-lookup-change-scope-link"
      >
        {AUDIT_EVIDENCE_LOOKUP_CHANGE_SCOPE_ACTION}
      </Link>
    </div>
  );
}
