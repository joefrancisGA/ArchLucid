import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import {
  readStoredRecentViewsState,
  type OperatorRecentViewEntry,
} from "@/lib/operator/operator-recent-views";

export type ContinueLastArchitectureIdentityTarget = {
  readonly architectureId: string;
  readonly label: string;
  readonly href: string;
  readonly visitedAtUtc: string;
};

const ARCHITECTURE_IDENTITY_PATH_PREFIX = "/architecture/architectures/";

function architectureIdFromIdentityHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(ARCHITECTURE_IDENTITY_PATH_PREFIX)) {
    return null;
  }

  const remainder = path.slice(ARCHITECTURE_IDENTITY_PATH_PREFIX.length).trim();

  if (remainder.length === 0 || remainder === "new" || remainder.includes("/")) {
    return null;
  }

  if (href.includes("draft=")) {
    return null;
  }

  return remainder;
}

function readRecentArchitectureEntry(architectureId: string): OperatorRecentViewEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const state = readStoredRecentViewsState();

    for (const entry of state.entries) {
      if (entry.kind !== "architecture") {
        continue;
      }

      const entryArchitectureId = entry.architectureId?.trim() ?? architectureIdFromIdentityHref(entry.href);

      if (entryArchitectureId === architectureId) {
        return entry;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the architecture identity desk to pin on Working Overview (CA-37 / IS-13). */
export function resolveContinueLastArchitectureIdentityTarget(): ContinueLastArchitectureIdentityTarget | null {
  const architectureId = readCachedLastOpenArchitectureId();

  if (architectureId === null) {
    return null;
  }

  const recent = readRecentArchitectureEntry(architectureId);
  const label = recent?.label.trim() ?? "Architecture";

  return {
    architectureId,
    label: label.length > 0 ? label : "Architecture",
    href: architectureIdentityPath(architectureId),
    visitedAtUtc: recent?.visitedAtUtc ?? new Date().toISOString(),
  };
}
