"use client";

import { useEffect, useState } from "react";

import {
  fetchCloudResourceEvidenceHub,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildInfraEvidenceResourceHubCacheKey,
  readCachedInfraEvidenceResourceHub,
  writeCachedInfraEvidenceResourceHub,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";

export function useInfraEvidenceResourceHubAuditLineage(
  cloudResourceId: string,
  snapshotId?: string,
): {
  readonly hub: CloudResourceEvidenceHubResponse | null;
  readonly loading: boolean;
  readonly loadError: string | null;
} {
  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (cloudResourceId.trim().length === 0) {
      setHub(null);
      setLoadError(null);
      setLoading(false);

      return;
    }

    const cacheKey = buildInfraEvidenceResourceHubCacheKey(cloudResourceId, snapshotId);
    const cachedHub = readCachedInfraEvidenceResourceHub(cacheKey);

    if (cachedHub != null) {
      setHub(cachedHub);
      setLoadError(null);
      setLoading(false);

      return;
    }

    let cancelled = false;

    async function loadHub() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetchCloudResourceEvidenceHub(cloudResourceId, {
          snapshotId: snapshotId != null && snapshotId.trim().length > 0 ? snapshotId.trim() : undefined,
        });

        if (!cancelled) {
          writeCachedInfraEvidenceResourceHub(cacheKey, response);
          setHub(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setHub(null);
          setLoadError(formatInfraEvidenceHubApiError(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHub();

    return () => {
      cancelled = true;
    };
  }, [cloudResourceId, snapshotId]);

  return { hub, loading, loadError };
}
