import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INHABIT_CONTINUITY_ROWS,
  INHABIT_DISPOSITION_REVERSIBILITY_ROWS,
  INHABIT_EXPLORATION_CEREMONY_ROWS,
  INHABIT_FINDINGS_EDITOR_SURFACE_ROWS,
  INHABIT_KEYBOARD_FOCUS_ROWS,
  INHABIT_LEAK_INVENTORIES_DOC_PATH,
  INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS,
  INHABIT_RECORD_CTA_SIMULATOR_LEAK_ROWS,
  INHABIT_ROOM_PRESENTER_ROWS,
  INHABIT_NESTED_REVIEW_BACK_HREF_ROWS,
  INHABIT_WORKING_HOME_PIPELINE_ROWS,
} from "@/lib/inhabit-leak-inventories";
import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";

const REPO_ROOT = join(process.cwd(), "..");
const UI_ROOT = join(process.cwd(), "src");

describe("inhabit leak inventories (IH-004–IH-012)", () => {
  it("IH-004 inventories findings editor surfaces", () => {
    const kinds = INHABIT_FINDINGS_EDITOR_SURFACE_ROWS.map((row) => row.editorKind);

    expect(kinds).toContain("nested-findings-desk");
    expect(kinds).toContain("review-detail-inspect");
    expect(INHABIT_FINDINGS_EDITOR_SURFACE_ROWS.some((row) => row.ownerPrompt === "IH-015")).toBe(true);
  });

  it("IH-005 inventories Record CTA Simulator leaks and marks IH-025 surfaces", () => {
    const covered = INHABIT_RECORD_CTA_SIMULATOR_LEAK_ROWS.filter((row) => row.hasSimulatorIncompletenessCopy);

    expect(covered.length).toBeGreaterThanOrEqual(2);
    expect(INHABIT_RECORD_CTA_SIMULATOR_LEAK_ROWS.every((row) => row.hasSimulatorIncompletenessCopy)).toBe(
      true,
    );
    expect(covered.every((row) => row.ownerPrompt === "IH-025")).toBe(true);
  });

  it("IH-006 inventories disposition reversibility without lengthening undo", () => {
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(INHABIT_DISPOSITION_REVERSIBILITY_ROWS.some((row) => row.toastUndo)).toBe(true);
    expect(INHABIT_DISPOSITION_REVERSIBILITY_ROWS.every((row) => row.dispositionHistory)).toBe(true);
    expect(
      INHABIT_DISPOSITION_REVERSIBILITY_ROWS.find((row) => row.ownerPrompt === "IR-007")?.dispositionHistory,
    ).toBe(true);
  });

  it("IH-007 inventories quiet-engine desk vs export surfaces", () => {
    expect(INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS.every((row) => row.namesQuietEnginesOnDesk)).toBe(true);

    const preFinalize = INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS.find((row) =>
      row.relativePath.includes("PreFinalizeChecklistPanel"),
    );
    const runProgress = INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS.find((row) =>
      row.relativePath.includes("use-run-progress-tracker"),
    );

    expect(preFinalize?.namesQuietEnginesOnDesk).toBe(true);
    expect(runProgress?.ownerPrompt).toBe("IR-001");
    expect(runProgress?.namesQuietEnginesOnDesk).toBe(true);
  });

  it("IH-008 inventories exploration ceremony gaps on nested findings", () => {
    const nested = INHABIT_EXPLORATION_CEREMONY_ROWS.find((row) =>
      row.relativePath.includes("InhabitedFindingsDocumentChrome"),
    );

    expect(nested).toBeDefined();
    expect(nested!.sketchEntry).toBe(true);
    expect(nested!.committedCompareFromDesk).toBe(true);
  });

  it("IH-009 inventories presenter-only room mounts", () => {
    expect(
      INHABIT_ROOM_PRESENTER_ROWS.some((row) => !row.requiresLeavingArchitectureFindings),
    ).toBe(true);
    expect(
      INHABIT_ROOM_PRESENTER_ROWS.filter((row) => row.requiresLeavingArchitectureFindings).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("IH-010 inventories keyboard focus gaps", () => {
    const nestedRow = INHABIT_KEYBOARD_FOCUS_ROWS.find((row) => row.ownerPrompt === "IH-059");
    const shortcutsRow = INHABIT_KEYBOARD_FOCUS_ROWS.find((row) => row.ownerPrompt === "IR-008");
    const paletteRow = INHABIT_KEYBOARD_FOCUS_ROWS.find((row) => row.ownerPrompt === "IR-009");

    expect(nestedRow?.defaultFocusFirstFinding).toBe(true);
    expect(shortcutsRow?.defaultFocusFirstFinding).toBe(true);
    expect(paletteRow?.defaultFocusFirstFinding).toBe(true);
  });

  it("IH-011 inventories continuity persistence shapes", () => {
    expect(INHABIT_CONTINUITY_ROWS.some((row) => row.persistKind === "account-prefs")).toBe(true);
    expect(INHABIT_CONTINUITY_ROWS.filter((row) => row.architectureShaped).length).toBeGreaterThanOrEqual(3);
    expect(
      INHABIT_CONTINUITY_ROWS.find((row) => row.ownerPrompt === "IR-010")?.architectureShaped,
    ).toBe(true);
    expect(
      INHABIT_CONTINUITY_ROWS.find((row) => row.ownerPrompt === "IR-011")?.architectureShaped,
    ).toBe(true);
  });

  it("IH-012 inventories Working Home pipeline teaching surfaces", () => {
    expect(INHABIT_WORKING_HOME_PIPELINE_ROWS.every((row) => !row.teachesPipeline)).toBe(true);
    expect(
      INHABIT_WORKING_HOME_PIPELINE_ROWS.find((row) => row.ownerPrompt === "IR-002")?.teachesPipeline,
    ).toBe(false);
    expect(
      INHABIT_WORKING_HOME_PIPELINE_ROWS.find((row) => row.ownerPrompt === "IR-003")?.teachesPipeline,
    ).toBe(false);
  });

  it("IH-024 inventories nested review back-href surfaces", () => {
    expect(INHABIT_NESTED_REVIEW_BACK_HREF_ROWS.some((row) => row.returnsToArchitecture)).toBe(true);
    expect(INHABIT_NESTED_REVIEW_BACK_HREF_ROWS.some((row) => !row.returnsToArchitecture)).toBe(true);
  });

  it("documents IH-004–012 in markdown without claiming IH-015 shipped beyond landing resolver", () => {
    const doc = readFileSync(join(REPO_ROOT, INHABIT_LEAK_INVENTORIES_DOC_PATH), "utf8");

    expect(doc).toContain("IH-004");
    expect(doc).toContain("IH-012");
    expect(doc).toContain("MUTATION_UNDO_WINDOW_SECONDS = 300");
    expect(doc).not.toMatch(/draft-diff Compare is shipped/i);
  });

  it("keeps inventory module paths present on disk", () => {
    for (const row of INHABIT_RECORD_CTA_SIMULATOR_LEAK_ROWS) {
      expect(existsSync(join(UI_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });
});
