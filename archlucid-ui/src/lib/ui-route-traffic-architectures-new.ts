import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";

/**
 * Traffic workbook row ID for Create architecture bootstrap.
 * Owner backlog shorthand: ANE.
 */
export const ARCHITECTURES_NEW_TRAFFIC_ROW_ID = "ANE";

/** Canonical path tracked on the ANE workbook row. */
export const ARCHITECTURES_NEW_TRAFFIC_PATH = ARCHITECTURES_NEW_PATH;

/** Workbook Section column value (template catalog). */
export const ARCHITECTURES_NEW_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for ANE - documents Evidence chrome on Create architecture.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURES_NEW_TRAFFIC_NOTE =
  "Create architecture (Core review) - NewArchitecturePage renders ArchitectureDraftWorkspace on ARCHITECTURE_NEW_DRAFT_SEGMENT (no ArchitectureCreationBootstrap interstitial; deferred server create until first saveable field). Hub Create architecture opens workspace directly. Sibling RNX = start review; COR = first-architecture-review help; AR/ARA = architectures list/detail. Creating/saving a draft does not start a review; not a signed-record Sources trail. Score 58/100 (2026-08-06) - +8 for removing duplicate draft-picker step and junk untitled drafts on bounce. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
