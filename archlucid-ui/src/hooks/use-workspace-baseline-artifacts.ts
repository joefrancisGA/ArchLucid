"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet } from "@/lib/api/http";
import { AUTH_MODE } from "@/lib/auth-config";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import type { components } from "@/lib/api-types.generated";

type TenantWorkspaceBaselineArtifactsPayload = Pick<
  components["schemas"]["TenantWorkspaceBaselineArtifactsResponse"],
  "hasBaselineArtifacts"
>;

/** Loads `/v1/tenant/workspace-baseline-artifacts` for sponsor dashboard baseline ZIP nudges. */

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
      const json = await apiGet<TenantWorkspaceBaselineArtifactsPayload>(
        "/v1/tenant/workspace-baseline-artifacts",
      );

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
