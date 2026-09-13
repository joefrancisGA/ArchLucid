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
    expect(covered.every((row) => row.ownerPrompt === "IH-025")).toBe(true);
  });

  it("IH-006 inventories disposition reversibility without lengthening undo", () => {
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(INHABIT_DISPOSITION_REVERSIBILITY_ROWS.some((row) => row.toastUndo)).toBe(true);
    expect(INHABIT_DISPOSITION_REVERSIBILITY_ROWS.some((row) => !row.dispositionHistory)).toBe(true);
  });

  it("IH-007 inventories quiet-engine desk vs export surfaces", () => {
    expect(INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS.some((row) => !row.namesQuietEnginesOnDesk)).toBe(true);
    expect(INHABIT_QUIET_ENGINE_COMPLETENESS_ROWS.some((row) => row.namesQuietEnginesOnDesk)).toBe(true);
  });

  it("IH-008 inventories exploration ceremony gaps on nested findings", () => {
    const nested = INHABIT_EXPLORATION_CEREMONY_ROWS.find((row) =>
      row.relativePath.includes("ArchitectureNestedFindingsPageClient"),
    );

    expect(nested).toBeDefined();
    expect(nested!.sketchEntry).toBe(false);
  });

  it("IH-009 inventories presenter-only room mounts", () => {
    expect(INHABIT_ROOM_PRESENTER_ROWS.every((row) => row.requiresLeavingArchitectureFindings)).toBe(true);
  });

  it("IH-010 inventories keyboard focus gaps", () => {
    expect(INHABIT_KEYBOARD_FOCUS_ROWS.every((row) => !row.defaultFocusFirstFinding)).toBe(true);
  });

  it("IH-011 inventories continuity persistence shapes", () => {
    expect(INHABIT_CONTINUITY_ROWS.some((row) => row.persistKind === "local-storage")).toBe(true);
    expect(INHABIT_CONTINUITY_ROWS.some((row) => !row.architectureShaped)).toBe(true);
  });

  it("IH-012 inventories Working Home pipeline teaching surfaces", () => {
    expect(INHABIT_WORKING_HOME_PIPELINE_ROWS.some((row) => row.teachesPipeline)).toBe(true);
    expect(INHABIT_WORKING_HOME_PIPELINE_ROWS.some((row) => !row.teachesPipeline)).toBe(true);
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
