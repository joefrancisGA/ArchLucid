"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import {
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD,
} from "@/lib/cloud-connections-copy";
import {
  type CloudPlatformId,
  type CloudPlatformScope,
  readCloudPlatformScopeFromStorage,
  subscribeCloudPlatformScopeChanges,
  writeCloudPlatformScopeToStorage,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PLATFORM_LABELS: Readonly<Record<CloudPlatformId, string>> = {
  "evidence-only": "Evidence-only",
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

export function CloudPlatformScopePanel() {
  const [scope, setScope] = useState<CloudPlatformScope>(() => readCloudPlatformScopeFromStorage());

  useEffect(() => subscribeCloudPlatformScopeChanges(() => setScope(readCloudPlatformScopeFromStorage())), []);

  const togglePlatform = (platformId: CloudPlatformId) => {
    const nextScope: CloudPlatformScope = {
      ...scope,
      [platformId]: !scope[platformId],
    };

    setScope(nextScope);
    writeCloudPlatformScopeToStorage(nextScope);
  };

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="cloud-platform-scope-panel"
      aria-labelledby="cloud-platform-scope-heading"
    >
      <h2 id="cloud-platform-scope-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING}
      </h2>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        {(Object.keys(PLATFORM_LABELS) as CloudPlatformId[]).map((platformId) => (
          <label key={platformId} className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
            <input
              type="checkbox"
              checked={scope[platformId]}
              onChange={() => togglePlatform(platformId)}
              data-testid={`cloud-platform-scope-${platformId}`}
            />
            <span>{PLATFORM_LABELS[platformId]}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
