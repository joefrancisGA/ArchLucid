import { isSimulatorAgentExecutionMode, type AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import { type WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

/**
 * Query keys that can imply the Working Career/Rehearsal door on review/desk share URLs.
 * First listed key with a parseable value wins (CG-013).
 */
export const WORKING_CAREER_REHEARSAL_DOOR_QUERY_KEYS = [
  "workingCareerRehearsalDoor",
  "workingDoor",
  "door",
  "career",
  "rehearsal",
] as const;

export type WorkingCareerRehearsalDoorQueryKey = (typeof WORKING_CAREER_REHEARSAL_DOOR_QUERY_KEYS)[number];

/**
 * Search keys that look like Mode/door but must not mint Career chrome.
 * `mode` is the new-run wizard / replay path. `intent` is clone continuation. Do not steal them.
 */
export const WORKING_CAREER_REHEARSAL_DOOR_NON_DOOR_QUERY_KEYS = [
  "mode",
  "reviewMode",
  "replayMode",
  "graphMode",
  "mermaidMode",
  "inputMode",
  "intent",
  "executionMode",
] as const;

export const CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY.md" as const;

export type SearchParamReader = {
  get(name: string): string | null | undefined;
};

export type ResolveWorkingCareerRehearsalDoorFromSearchInput = {
  readonly search: SearchParamReader;
  readonly storedDoor: WorkingCareerRehearsalDoorId;
  readonly structuralExecutionMode: AgentExecutionModeWire | null;
  readonly applyQuery: boolean;
};

export type ResolveWorkingCareerRehearsalDoorFromSearchResult = {
  readonly door: WorkingCareerRehearsalDoorId;
  readonly requestedDoor: WorkingCareerRehearsalDoorId | null;
  readonly ignoredCareerQuery: boolean;
};

function readSearchValue(search: SearchParamReader, name: string): string | null {
  const value = search.get(name);

  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

function isTruthyQueryFlag(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();

  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/** Strict door parse for query values — unknown strings are not rehearsal by default. */
export function tryParseWorkingCareerRehearsalDoorQueryValue(
  value: string | null | undefined,
): WorkingCareerRehearsalDoorId | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  if (normalized === WORKING_CAREER_DOOR_LABEL.toLowerCase() || normalized === "career") {
    return "career";
  }

  if (normalized === WORKING_REHEARSAL_DOOR_LABEL.toLowerCase() || normalized === "rehearsal") {
    return "rehearsal";
  }

  return null;
}

function parseFlagKey(
  search: SearchParamReader,
  key: "career" | "rehearsal",
): WorkingCareerRehearsalDoorId | null {
  const raw = readSearchValue(search, key);

  if (raw === null) {
    return null;
  }

  const asDoor = tryParseWorkingCareerRehearsalDoorQueryValue(raw);

  if (asDoor === key) {
    return asDoor;
  }

  if (isTruthyQueryFlag(raw)) {
    return key;
  }

  return null;
}

/**
 * Reads door-implying query keys. `?career=1&rehearsal=1` resolves to rehearsal.
 * Non-door keys (`mode`, `intent`, `executionMode`) are ignored.
 */
export function parseWorkingCareerRehearsalDoorFromSearch(
  search: SearchParamReader,
): WorkingCareerRehearsalDoorId | null {
  const explicitKeys = ["workingCareerRehearsalDoor", "workingDoor", "door"] as const;

  for (const key of explicitKeys) {
    const parsed = tryParseWorkingCareerRehearsalDoorQueryValue(readSearchValue(search, key));

    if (parsed !== null) {
      return parsed;
    }
  }

  const careerFlag = parseFlagKey(search, "career");
  const rehearsalFlag = parseFlagKey(search, "rehearsal");

  if (rehearsalFlag === "rehearsal") {
    return "rehearsal";
  }

  if (careerFlag === "career") {
    return "career";
  }

  return null;
}

function structuralModeAllowsCareerQuery(mode: AgentExecutionModeWire | null): boolean {
  if (mode === null) {
    return false;
  }

  if (isSimulatorAgentExecutionMode(mode)) {
    return false;
  }

  return mode === "Real";
}

/**
 * Working share URLs cannot mint unlabeled Career chrome on structural Simulator (CG-013).
 * Query overlays chrome only — they never write UserSettings or localStorage.
 */
export function resolveWorkingCareerRehearsalDoorFromSearch(
  input: ResolveWorkingCareerRehearsalDoorFromSearchInput,
): ResolveWorkingCareerRehearsalDoorFromSearchResult {
  const requestedDoor = parseWorkingCareerRehearsalDoorFromSearch(input.search);

  if (!input.applyQuery || requestedDoor === null) {
    return {
      door: input.storedDoor,
      requestedDoor,
      ignoredCareerQuery: false,
    };
  }

  if (requestedDoor === "career" && !structuralModeAllowsCareerQuery(input.structuralExecutionMode)) {
    return {
      door: input.storedDoor,
      requestedDoor,
      ignoredCareerQuery: true,
    };
  }

  return {
    door: requestedDoor,
    requestedDoor,
    ignoredCareerQuery: false,
  };
}
