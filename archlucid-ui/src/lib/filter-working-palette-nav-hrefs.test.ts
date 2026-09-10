import { describe, expect, it } from "vitest";

import {
  WORKING_PALETTE_EVAL_ADMIN_ALLOWLIST,
  WORKING_PALETTE_HELP_ALLOWLIST,
  filterWorkingPaletteNavHrefs,
  isWorkingPaletteNavHrefAllowed,
} from "@/lib/filter-working-palette-nav-hrefs";
import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

describe("filterWorkingPaletteNavHrefs (AO-41)", () => {
  it("AO-41: allows architecture desks, inboxes, settings, and help in Working palette", () => {
    expect(isWorkingPaletteNavHrefAllowed(ARCHITECTURES_LIST_PATH)).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed(REVIEWS_LIST_PATH)).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed("/")).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed("/governance/findings")).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed(SETTINGS_ROOT_PATH)).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed("/help/getting-started")).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed(SIGNED_RECORDS_LIST_PATH)).toBe(true);
    expect(isWorkingPaletteNavHrefAllowed(SPONSOR_DASHBOARD_HREF)).toBe(true);
  });

  it("AO-41: excludes bind tools and eval-only destinations from Working palette", () => {
    expect(isWorkingPaletteNavHrefAllowed(EVIDENCE_GRAPH_PATH)).toBe(false);
    expect(isWorkingPaletteNavHrefAllowed(ASK_REVIEW_QUESTIONS_PATH)).toBe(false);
    expect(isWorkingPaletteNavHrefAllowed("/internal/health")).toBe(false);
    expect(isWorkingPaletteNavHrefAllowed("/demo/workspaces")).toBe(false);
    expect(isWorkingPaletteNavHrefAllowed("/governance/audit")).toBe(false);
    expect(isWorkingPaletteNavHrefAllowed("/architecture/reviews/review-1")).toBe(false);
  });

  it("AO-41: filters href sets while preserving allowlisted help paths", () => {
    const input = new Set<string>([
      REVIEWS_LIST_PATH,
      EVIDENCE_GRAPH_PATH,
      "/help/report-problem",
      "/internal/health",
    ]);
    const filtered = filterWorkingPaletteNavHrefs(input);

    expect(filtered.has(REVIEWS_LIST_PATH)).toBe(true);
    expect(filtered.has("/help/report-problem")).toBe(true);
    expect(filtered.has(EVIDENCE_GRAPH_PATH)).toBe(false);
    expect(filtered.has("/internal/health")).toBe(false);
  });

  it("AO-41: documents explicit help and pilot allowlists", () => {
    expect(WORKING_PALETTE_HELP_ALLOWLIST.has("/help")).toBe(true);
    expect(WORKING_PALETTE_EVAL_ADMIN_ALLOWLIST.has(SIGNED_RECORDS_LIST_PATH)).toBe(true);
  });
});
