import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INHABIT_POST_IR_ALL_LEAK_ROWS,
  INHABIT_POST_IR_COMPLETION_TOAST_ROWS,
  INHABIT_POST_IR_GLOBAL_SEARCH_LANDING_ROWS,
  INHABIT_POST_IR_INHABITED_CHROME_ROWS,
  INHABIT_POST_IR_INSPECTOR_FINALIZE_ROWS,
  INHABIT_POST_IR_INSPECT_SUPPORT_BAND_ROWS,
  INHABIT_POST_IR_LEAK_INVENTORIES_DOC_PATH,
  INHABIT_POST_IR_QUICK_DECISION_ROWS,
  INHABIT_POST_IR_REVIEWS_HUB_LANDING_ROWS,
  INHABIT_POST_IR_ROOM_ON_REVIEW_DETAIL_ROWS,
  INHABIT_POST_IR_SECONDARY_RERUN_ROWS,
  INHABIT_POST_IR_WORKING_SHARE_ROWS,
} from "@/lib/inhabit-post-ir-leak-inventories";

const REPO_ROOT = join(process.cwd(), "..");
const UI_ROOT = join(process.cwd(), "src");

const EXPECTED_OWNER_PROMPTS = [
  "IP-002",
  "IP-003",
  "IP-004",
  "IP-005",
  "IP-006",
  "IP-007",
  "IP-008",
  "IP-009",
  "IP-010",
  "IP-011",
] as const;

describe("inhabit post-IR leak inventories (IP-001)", () => {
  it("IP-001: inventories all post-IR secondary inspector leak clusters", () => {
    expect(INHABIT_POST_IR_REVIEWS_HUB_LANDING_ROWS.every((row) => row.ownerPrompt === "IP-002")).toBe(
      true,
    );
    expect(INHABIT_POST_IR_GLOBAL_SEARCH_LANDING_ROWS.every((row) => row.ownerPrompt === "IP-003")).toBe(
      true,
    );
    expect(INHABIT_POST_IR_WORKING_SHARE_ROWS.every((row) => row.ownerPrompt === "IP-004")).toBe(true);
    expect(INHABIT_POST_IR_QUICK_DECISION_ROWS.every((row) => row.ownerPrompt === "IP-005")).toBe(true);
    expect(INHABIT_POST_IR_COMPLETION_TOAST_ROWS.every((row) => row.ownerPrompt === "IP-006")).toBe(true);
    expect(INHABIT_POST_IR_ROOM_ON_REVIEW_DETAIL_ROWS.every((row) => row.ownerPrompt === "IP-007")).toBe(
      true,
    );
    expect(INHABIT_POST_IR_INSPECT_SUPPORT_BAND_ROWS.every((row) => row.ownerPrompt === "IP-008")).toBe(
      true,
    );
    expect(INHABIT_POST_IR_SECONDARY_RERUN_ROWS.every((row) => row.ownerPrompt === "IP-009")).toBe(true);
    expect(INHABIT_POST_IR_INSPECTOR_FINALIZE_ROWS.every((row) => row.ownerPrompt === "IP-010")).toBe(
      true,
    );
    expect(INHABIT_POST_IR_INHABITED_CHROME_ROWS.every((row) => row.ownerPrompt === "IP-011")).toBe(true);
  });

  it("IP-002–IP-006: closed dual-place rows stay flipped off", () => {
    expect(INHABIT_POST_IR_REVIEWS_HUB_LANDING_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_GLOBAL_SEARCH_LANDING_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_WORKING_SHARE_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_QUICK_DECISION_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_COMPLETION_TOAST_ROWS.every((row) => !row.leakOpen)).toBe(true);
  });

  it("IP-002–IP-010: closed product rows stay flipped off", () => {
    expect(INHABIT_POST_IR_ROOM_ON_REVIEW_DETAIL_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_INSPECT_SUPPORT_BAND_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_SECONDARY_RERUN_ROWS.every((row) => !row.leakOpen)).toBe(true);
    expect(INHABIT_POST_IR_INSPECTOR_FINALIZE_ROWS.every((row) => !row.leakOpen)).toBe(true);
  });

  it("IP-001: remaining product rows stay open until their IP ships", () => {
    const openOwnerPrompts = new Set(
      INHABIT_POST_IR_ALL_LEAK_ROWS.filter((row) => row.leakOpen).map((row) => row.ownerPrompt),
    );

    expect(openOwnerPrompts.has("IP-002")).toBe(false);
    expect(openOwnerPrompts.has("IP-010")).toBe(false);
    expect(openOwnerPrompts.has("IP-011")).toBe(true);
  });

  it("IP-001: covers every product owner prompt IP-002 through IP-011", () => {
    const owners = new Set(INHABIT_POST_IR_ALL_LEAK_ROWS.map((row) => row.ownerPrompt));

    for (const ownerPrompt of EXPECTED_OWNER_PROMPTS) {
      expect(owners.has(ownerPrompt), `missing owner ${ownerPrompt}`).toBe(true);
    }
  });

  it("IP-001: markdown inventory matches TypeScript module", () => {
    const doc = readFileSync(join(REPO_ROOT, INHABIT_POST_IR_LEAK_INVENTORIES_DOC_PATH), "utf8");

    expect(doc).toContain("IP-002");
    expect(doc).toContain("IP-011");
    expect(doc).toContain("inhabit-post-ir-leak-inventories.ts");
    expect(doc).toContain("WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md");
    expect(doc).toContain("IR-015");
    expect(doc).toContain("ReviewRoomHeaderButton.tsx");
    expect(doc).toContain("use-review-completion-notification.ts");
    expect(doc).toContain("| No | IP-002 |");
    expect(doc).toContain("| No | IP-006 |");
  });

  it("IP-001: keeps inventory module paths present on disk", () => {
    for (const row of INHABIT_POST_IR_ALL_LEAK_ROWS) {
      expect(existsSync(join(UI_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });
});
