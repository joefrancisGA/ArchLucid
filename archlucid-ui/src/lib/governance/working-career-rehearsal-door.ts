/**
 * Working Career vs Rehearsal door preference (ADR 0086 / AS-077).
 *
 * **Persistence scope (documented choice):**
 * - **Architecture-level** when `architectureId` is known (desk continuity or architecture route) —
 *   mixed reviews on one tenant keep per-architecture intent in `localStorage`.
 * - **Tenant-level** fallback when no architecture context is active — same browser profile default
 *   for new desks until an architecture is opened.
 *
 * Server-backed user preferences are intentionally **not** extended in AS-077; AS-080 may add tenant
 * UI intent default on the API. Until then, `localStorage` is the source of truth for the chooser.
 *
 * **AS-080 grandfather:** Pre-chooser Working profiles and Simulator clones keep **Rehearsal** until
 * the operator explicitly picks Career. New first-run Working tenants default to **Career** (AS-078 may
 * block execute until Real is ready). The grandfather marker freezes legacy posture — no silent migration.
 */
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

export const WORKING_CAREER_REHEARSAL_DOOR_IDS = ["career", "rehearsal"] as const;

export type WorkingCareerRehearsalDoorId = (typeof WORKING_CAREER_REHEARSAL_DOOR_IDS)[number];

/** AS-080: First-run Working tenants open on Career intent. */
export const NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT: WorkingCareerRehearsalDoorId = "career";

/**
 * Grandfather default for Simulator clones and pre-AS-080 Working profiles — not migrated to Career
 * silently when legacy usage signals or the grandfather marker are present.
 */
export const LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT: WorkingCareerRehearsalDoorId = "rehearsal";

/**
 * Safe fallback when door context is unknown (AS-079 suppression). Stays rehearsal so career-looking
 * chrome is not assumed without an explicit Career choice.
 */
export const DEFAULT_WORKING_CAREER_REHEARSAL_DOOR = LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT;

export const WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY = "archlucid.working-door.tenant.v1";

export const WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY =
  "archlucid.working-door.tenant.grandfather-rehearsal.v1";

/** localStorage keys that indicate Working usage before explicit door preference (AS-080 grandfather). */
export const LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS = [
  "archlucid.workspace-mode.v1.personal",
  "archlucid.lastOpenArchitectureId.v1",
] as const;

export function workingCareerRehearsalArchitectureStorageKey(architectureId: string): string {
  const trimmed = architectureId.trim();

  return `archlucid.working-door.architecture.${trimmed}.v1`;
}

export function parseWorkingCareerRehearsalDoorId(
  value: string | null | undefined,
): WorkingCareerRehearsalDoorId {
  if (value === null || value === undefined) {
    return DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === WORKING_CAREER_DOOR_LABEL.toLowerCase() || normalized === "career") {
    return "career";
  }

  if (normalized === WORKING_REHEARSAL_DOOR_LABEL.toLowerCase() || normalized === "rehearsal") {
    return "rehearsal";
  }

  return DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
}

export function labelForWorkingCareerRehearsalDoor(door: WorkingCareerRehearsalDoorId): string {
  if (door === "career") {
    return WORKING_CAREER_DOOR_LABEL;
  }

  return WORKING_REHEARSAL_DOOR_LABEL;
}

export type ResolveWorkingCareerRehearsalDoorScopeInput = {
  readonly architectureId?: string | null;
};

export type WorkingCareerRehearsalDoorScope =
  | { readonly kind: "architecture"; readonly architectureId: string }
  | { readonly kind: "tenant" };

export function resolveWorkingCareerRehearsalDoorScope(
  input: ResolveWorkingCareerRehearsalDoorScopeInput,
): WorkingCareerRehearsalDoorScope {
  const architectureId = input.architectureId?.trim() ?? "";

  if (architectureId.length > 0) {
    return { kind: "architecture", architectureId };
  }

  return { kind: "tenant" };
}

function storageKeyForScope(scope: WorkingCareerRehearsalDoorScope): string {
  if (scope.kind === "architecture") {
    return workingCareerRehearsalArchitectureStorageKey(scope.architectureId);
  }

  return WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY;
}

export type ResolveDefaultWorkingCareerRehearsalDoorInput = {
  readonly hasGrandfatherRehearsalMarker?: boolean;
  readonly hasLegacyWorkingUsageSignals?: boolean;
};

/** AS-080 — Career for new Working tenants; Rehearsal for grandfathered Simulator clones. */
export function resolveDefaultWorkingCareerRehearsalDoor(
  input: ResolveDefaultWorkingCareerRehearsalDoorInput,
): WorkingCareerRehearsalDoorId {
  if (input.hasGrandfatherRehearsalMarker === true || input.hasLegacyWorkingUsageSignals === true) {
    return LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT;
  }

  return NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT;
}

function readGrandfatherRehearsalMarker(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY) === "1";
  }
  catch {
    return false;
  }
}

function writeGrandfatherRehearsalMarker(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY, "1");
  }
  catch {
    /* private mode */
  }
}

export function hasLegacyWorkingDoorUsageSignals(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    for (const signalKey of LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS) {
      if (window.localStorage.getItem(signalKey) !== null) {
        return true;
      }
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith("archlucid.working-door.architecture.")) {
        return true;
      }
    }
  }
  catch {
    return false;
  }

  return false;
}

function resolveImplicitWorkingCareerRehearsalDoorDefault(): WorkingCareerRehearsalDoorId {
  const hasGrandfatherRehearsalMarker = readGrandfatherRehearsalMarker();
  const hasLegacyWorkingUsageSignals = hasLegacyWorkingDoorUsageSignals();

  if (hasLegacyWorkingUsageSignals && !hasGrandfatherRehearsalMarker) {
    writeGrandfatherRehearsalMarker();
  }

  return resolveDefaultWorkingCareerRehearsalDoor({
    hasGrandfatherRehearsalMarker,
    hasLegacyWorkingUsageSignals,
  });
}

function readDoorFromStorageKey(storageKey: string): WorkingCareerRehearsalDoorId | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (raw === null) {
      return null;
    }

    return parseWorkingCareerRehearsalDoorId(raw);
  }
  catch {
    return null;
  }
}

function writeDoorToStorageKey(storageKey: string, door: WorkingCareerRehearsalDoorId): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, door);
  }
  catch {
    /* private mode */
  }
}

export function readWorkingCareerRehearsalDoorFromStorage(
  scope: WorkingCareerRehearsalDoorScope,
): WorkingCareerRehearsalDoorId {
  if (scope.kind === "architecture") {
    const architectureDoor = readDoorFromStorageKey(storageKeyForScope(scope));

    if (architectureDoor !== null) {
      return architectureDoor;
    }

    const tenantDoor = readDoorFromStorageKey(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY);

    if (tenantDoor !== null) {
      return tenantDoor;
    }

    return resolveImplicitWorkingCareerRehearsalDoorDefault();
  }

  const tenantDoor = readDoorFromStorageKey(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY);

  if (tenantDoor !== null) {
    return tenantDoor;
  }

  return resolveImplicitWorkingCareerRehearsalDoorDefault();
}

export function writeWorkingCareerRehearsalDoorToStorage(
  scope: WorkingCareerRehearsalDoorScope,
  door: WorkingCareerRehearsalDoorId,
): void {
  writeDoorToStorageKey(storageKeyForScope(scope), door);
}

export function cycleWorkingCareerRehearsalDoor(
  current: WorkingCareerRehearsalDoorId,
): WorkingCareerRehearsalDoorId {
  if (current === "career") {
    return "rehearsal";
  }

  return "career";
}

/** AS-079 / LP-18 — Rehearsal Working door cannot show Ready-to-finalize chrome (Career-only). */
export function shouldSuppressReadyToFinalizeForWorkingRehearsalDoor(input: {
  readonly workingDesk?: boolean;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  const effectiveDoor = input.effectiveWorkingCareerRehearsalDoor ?? DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;

  return effectiveDoor !== "career";
}
