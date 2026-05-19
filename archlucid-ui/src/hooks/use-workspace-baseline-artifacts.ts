"use client";

import { useCallback, useEffect, useState } from "react";

import { AUTH_MODE } from "@/lib/auth-config";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type TenantWorkspaceBaselineArtifactsPayload = {
  hasBaselineArtifacts?: unknown;
};

/** Loads `/v1/tenant/workspace-baseline-artifacts` for executive dashboard baseline ZIP nudges. */

export function useWorkspaceBaselineArtifactsPresence(): {
  loading: boolean;
  hasBaselineArtifacts: boolean | null;
  reload: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [hasBaselineArtifacts, setHasBaselineArtifacts] = useState<boolean | null>(null);

  const reload = useCallback(async () => {
    if (isNextPublicDemoMode()) {
      setHasBaselineArtifacts(true);
      setLoading(false);

      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setHasBaselineArtifacts(null);
      setLoading(false);

      return;
    }

    setLoading(true);

    try {
      const headers = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const res = await fetch("/api/proxy/v1/tenant/workspace-baseline-artifacts", headers);

      if (!res.ok) {
        setHasBaselineArtifacts(null);

        return;
      }

      const json = (await res.json()) as TenantWorkspaceBaselineArtifactsPayload;

      setHasBaselineArtifacts(json.hasBaselineArtifacts === true);
    } catch {
      setHasBaselineArtifacts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, hasBaselineArtifacts, reload };
}
