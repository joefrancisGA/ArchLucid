import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet } from "@/types/draft-intake";

const RECOVERY_KEY = "archlucid.architecture-new-draft-recovery.v1";

export type ArchitectureNewDraftRecoverySnapshot = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly queuedAtUtc: string;
};

type ArchitectureNewDraftRecoveryEnvelope = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly queuedAtUtc: string;
};

export function writeArchitectureNewDraftRecovery(snapshot: ArchitectureNewDraftRecoverySnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: ArchitectureNewDraftRecoveryEnvelope = {
    fields: snapshot.fields,
    actorSet: snapshot.actorSet,
    queuedAtUtc: snapshot.queuedAtUtc,
  };

  try {
    window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(envelope));
  } catch {
    /* private mode */
  }
}

export function readArchitectureNewDraftRecovery(): ArchitectureNewDraftRecoverySnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(RECOVERY_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as ArchitectureNewDraftRecoveryEnvelope;

    if (parsed === null || typeof parsed !== "object" || parsed.fields === undefined || parsed.actorSet === undefined) {
      return null;
    }

    return {
      fields: parsed.fields,
      actorSet: parsed.actorSet,
      queuedAtUtc: parsed.queuedAtUtc ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearArchitectureNewDraftRecovery(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(RECOVERY_KEY);
}

export function resetArchitectureNewDraftRecoveryForTests(): void {
  clearArchitectureNewDraftRecovery();
}
