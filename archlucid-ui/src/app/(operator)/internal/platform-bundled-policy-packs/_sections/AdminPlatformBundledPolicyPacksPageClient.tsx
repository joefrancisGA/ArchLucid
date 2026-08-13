"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { listPlatformBundledPolicyPacks, setPlatformBundledPolicyPackActivation } from "@/lib/api";
import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import type { PlatformBundledPolicyPackRegistryEntry } from "@/types/policy-packs";
import { cn } from "@/lib/utils";

export function AdminPlatformBundledPolicyPacksPageClient() {
  const [rows, setRows] = useState<PlatformBundledPolicyPackRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingFile, setUpdatingFile] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listPlatformBundledPolicyPacks();
      setRows(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggle = async (row: PlatformBundledPolicyPackRegistryEntry) => {
    setUpdatingFile(row.bundleContentFile);
    setError(null);

    try {
      await setPlatformBundledPolicyPackActivation(row.bundleContentFile, !row.isGloballyActive);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setUpdatingFile(null);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl", OPERATOR_LAYOUT.sectionStack)} data-testid="admin-platform-bundled-policy-packs-page">
      <OperatorPageHeader
        navHref={INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH}
        title="Platform policy packs"
        headingLevel="h1"
        subtitle="Activate or deactivate bundled policy packs for every tenant. Deactivated packs disappear from tenant workspaces and no longer apply to reviews."
        actions={<PageContextualHelpButton />}
      />

      {error !== null ? (
        <p role="alert" className={cn("rounded-md border border-rose-600/40 bg-al-surface-raised p-2", OPERATOR_TYPOGRAPHY.body)}>
          {error}
        </p>
      ) : null}

      {loading ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading bundled packs…</p> : null}

      <ul className="m-0 list-none space-y-2 p-0">
        {rows.map((row) => (
          <li
            key={row.bundleContentFile}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
            data-testid={`platform-bundled-policy-pack-${row.bundleContentFile}`}
          >
            <div className="min-w-0">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.displayName}</p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.bundleContentFile}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusTag
                kind={row.isGloballyActive ? "ready" : "neutral"}
                label={row.isGloballyActive ? "Active globally" : "Deactivated globally"}
              />
              <Button
                type="button"
                variant="outline"
                disabled={updatingFile === row.bundleContentFile}
                onClick={() => {
                  void onToggle(row);
                }}
              >
                {updatingFile === row.bundleContentFile
                  ? "Saving…"
                  : row.isGloballyActive
                    ? "Deactivate globally"
                    : "Activate globally"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
