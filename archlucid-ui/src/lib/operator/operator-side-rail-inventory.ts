/**
 * TB-1575 — Operator side-rail inventory for key hubs + integrations + help.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator side rails (**TB-1572**).
 * Live pin policy: `operator-live-preview-readiness-rail` (**TB-1574**).
 *
 * ## TB-1576 checklist (extend Vitest allowlist from this inventory)
 * 1. Import `OPERATOR_SIDE_RAIL_INVENTORY` / `OPERATOR_SIDE_RAIL_ALLOWED_KINDS`.
 * 2. For each `disposition: "allowed"` row, assert the surface mounts
 *    `data-operator-side-rail-kind` (or `data-rail-kind` for live) matching `kind`.
 * 3. For each `disposition: "demoted-single-column"` row, assert no
 *    `lg:grid-cols-[minmax(0,1fr)_17.5rem]` (or peer) two-col about-aside shell.
 * 4. Fail teaching/static markers (`data-operator-side-rail-kind="teaching"` /
 *    `"static-scope"`) and empty two-col on allowlisted empties.
 * 5. Add a new inventory row when migrating another hub — keep kinds named.
 */

import { OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND } from "@/lib/operator/operator-live-preview-readiness-rail";

/** Allowed persistent right-column kinds (PR notes / data attributes). */
export const OPERATOR_SIDE_RAIL_ALLOWED_KINDS = [
  "working-object",
  "master-detail",
  OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND,
  "toc-wizard",
] as const;

export type OperatorSideRailAllowedKind = (typeof OPERATOR_SIDE_RAIL_ALLOWED_KINDS)[number];

/** Banned kinds — must not appear as persistent right columns. */
export const OPERATOR_SIDE_RAIL_BANNED_KINDS = [
  "teaching",
  "static-scope",
  "about-aside",
] as const;

export type OperatorSideRailBannedKind = (typeof OPERATOR_SIDE_RAIL_BANNED_KINDS)[number];

export type OperatorSideRailDisposition =
  | "allowed"
  | "demoted-single-column"
  | "single-column-default";

export type OperatorSideRailInventoryEntry = {
  readonly id: string;
  readonly pathOrSurface: string;
  readonly kind: OperatorSideRailAllowedKind | OperatorSideRailBannedKind | "none";
  readonly disposition: OperatorSideRailDisposition;
  readonly markerTestId: string | null;
  readonly notes: string;
};

/**
 * Key operator hubs + integrations + help — checked in for agents and **TB-1576**.
 * File order matches owner side-rail convention pass exemplars.
 */
export const OPERATOR_SIDE_RAIL_INVENTORY: readonly OperatorSideRailInventoryEntry[] = [
  {
    id: "recurrence-schedules",
    pathOrSurface: "/governance/recurrence",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "recurrence-schedules-page",
    notes: "Teaching helper collapsed disclosure (**TB-1573** / Done **TB-1133** empty-hide).",
  },
  {
    id: "advisory-schedules",
    pathOrSurface: "/governance/advisory-scans?tab=schedules",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "advisory-schedules-layout",
    notes: "Orientation prose in pinned side column at xl; scope inline on create form (**AD-P0-9**).",
  },
  {
    id: "digests-schedule",
    pathOrSurface: "/architecture/digests?tab=schedule",
    kind: "live",
    disposition: "allowed",
    markerTestId: "exec-digest-schedule-layout",
    notes: "Live preview/readiness — pin when live (**TB-1574**); `data-rail-kind=live`.",
  },
  {
    id: "alert-rules-rules-tab",
    pathOrSurface: "/governance/alert-rules?tab=rules",
    kind: "live",
    disposition: "allowed",
    markerTestId: null,
    notes: "Live preview/readiness — pin when live (**TB-1574**); `data-rail-kind=live`.",
  },
  {
    id: "digests-browse",
    pathOrSurface: "/architecture/digests?tab=get-started",
    kind: "master-detail",
    disposition: "allowed",
    markerTestId: "digests-browse-master-detail",
    notes: "History table + detail pane are the page job.",
  },
  {
    id: "run-detail-workspace",
    pathOrSurface: "/architecture/reviews/[runId]",
    kind: "working-object",
    disposition: "allowed",
    markerTestId: "run-detail-workspace-layout",
    notes: "Sticky package / selection chrome when `rail` is mounted.",
  },
  {
    id: "help-topic-toc",
    pathOrSurface: "/help/{topic}",
    kind: "toc-wizard",
    disposition: "allowed",
    markerTestId: "help-topic-toc",
    notes: "On-this-page TOC sticky sidebar when heading count qualifies.",
  },
  {
    id: "integrations-slack",
    pathOrSurface: "/integrations/slack",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "integrations-slack-page",
    notes: "About-aside demoted — StatusTag + page help + security disclosure (**TB-1575**).",
  },
  {
    id: "integrations-teams",
    pathOrSurface: "/integrations/teams",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "integrations-teams-page",
    notes: "About-aside demoted — StatusTag + page help + setup disclosure (**TB-1575**).",
  },
  {
    id: "integrations-azure-boards",
    pathOrSurface: "/integrations/azure-boards",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "azure-boards-integration-aside",
    notes: "About-aside demoted to stacked column under primary form (**TB-1575**); density polish **TB-1756**.",
  },
  {
    id: "integrations-servicenow",
    pathOrSurface: "/integrations/servicenow",
    kind: "none",
    disposition: "demoted-single-column",
    markerTestId: "servicenow-integration-aside",
    notes: "About-aside demoted to stacked column under primary form (**TB-1575**).",
  },
] as const;

export function listOperatorSideRailAllowedEntries(): readonly OperatorSideRailInventoryEntry[] {
  return OPERATOR_SIDE_RAIL_INVENTORY.filter((entry) => entry.disposition === "allowed");
}

export function listOperatorSideRailDemotedEntries(): readonly OperatorSideRailInventoryEntry[] {
  return OPERATOR_SIDE_RAIL_INVENTORY.filter(
    (entry) => entry.disposition === "demoted-single-column",
  );
}

export function isOperatorSideRailAllowedKind(kind: string): boolean {
  return (OPERATOR_SIDE_RAIL_ALLOWED_KINDS as readonly string[]).includes(kind);
}
