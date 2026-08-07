import type { ConfigSummaryKeyRow } from "./admin-configuration-types";
import type { AdminConfigLintResponse } from "./admin-configuration-types";

export function normalizePath(s: string | null | undefined): string {
  if (s === null || s === undefined) {
    return "";
  }

  return s;
}

export function parseConfigLintPayload(json: unknown): AdminConfigLintResponse | null {
  if (typeof json !== "object" || json === null || !("ok" in json)) {
    return null;
  }

  const rec = json as { ok?: unknown };

  if (typeof rec.ok !== "boolean") {
    return null;
  }

  return json as AdminConfigLintResponse;
}

export function parseSummaryPayload(json: unknown): ConfigSummaryKeyRow[] {
  if (typeof json !== "object" || json === null || !("keys" in json)) {
    return [];
  }

  const keysVal = (json as { keys?: unknown }).keys;

  if (!Array.isArray(keysVal)) {
    return [];
  }

  return keysVal.filter((k): k is ConfigSummaryKeyRow => typeof k === "object" && k !== null);
}

export function formatSources(sources: string[] | null | undefined): string {
  if (sources === null || sources === undefined || sources.length === 0) {
    return "—";
  }

  return sources.join(", ");
}

export function sectionToTestIdSegment(section: string): string {
  return section
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
