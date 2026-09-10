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
 */
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

export const WORKING_CAREER_REHEARSAL_DOOR_IDS = ["career", "rehearsal"] as const;

export type WorkingCareerRehearsalDoorId = (typeof WORKING_CAREER_REHEARSAL_DOOR_IDS)[number];

/** Default day remains rehearsal for local/dev clones (ADR 0086). */
export const DEFAULT_WORKING_CAREER_REHEARSAL_DOOR: WorkingCareerRehearsalDoorId = "rehearsal";

export const WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY = "archlucid.working-door.tenant.v1";

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

    return DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
  }

  const tenantDoor = readDoorFromStorageKey(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY);

  if (tenantDoor !== null) {
    return tenantDoor;
  }

  return DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
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
