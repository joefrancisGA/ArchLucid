import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION,
  ARCHITECTURE_DIAGRAM_INSUFFICIENT_ORIENTATION,
  ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE,
} from "@/lib/architecture/architecture-diagram-copy";
import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CREATE_HOME_DIAGRAM_BAND_TEST_FILES = [
  "src/components/architecture/ArchitectureDiagramPanel.test.tsx",
  "src/components/architecture/ArchitectureCreatedWorkspaceDiagramTab.test.tsx",
] as const;

const RED_TRAFFIC_HONESTY_PHRASES = [
  "Create-home-only",
  "ignored on committed ReviewDetailWorkspace",
  "reviewTab=architecture",
  "cannot improve further toward 80",
] as const;

describe("create-home diagram band regression (TB-1845)", () => {
  it("keeps sibling Vitest guards for TB-1841 through TB-1844 on disk", () => {
    for (const relativePath of CREATE_HOME_DIAGRAM_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors RED traffic honesty for create-home-only reviewTab=architecture (TB-1841)", () => {
    const red = findUiRouteTrafficRow("RED");

    expect(red).toBeDefined();
    expect(red?.path).toBe("/architecture/reviews/[reviewId]?reviewTab=architecture");
    expect(red?.section).toBe("Tab surface");

    for (const phrase of RED_TRAFFIC_HONESTY_PHRASES) {
      expect(red?.note, phrase).toContain(phrase);
    }

    expect(red?.note).toContain("ArchitectureDiagramPanel");
    expect(red?.note).toContain("TB-1841");
  });

  it("keeps run-scoped clarify href builder for diagram CTAs (TB-1842)", () => {
    const href = buildArchitectureCorrectionHref("run-red", null);

    expect(href).toContain("rerun=run-red");
    expect(href).toContain("path=guided-intake");
  });

  it("keeps insufficient orientation and clarify action copy (TB-1843)", () => {
    expect(ARCHITECTURE_DIAGRAM_INSUFFICIENT_ORIENTATION).toMatch(/guided intake/i);
    expect(ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION).toBe("Clarify architecture");
  });

  it("keeps Mermaid source disclosure honesty copy (TB-1844)", () => {
    expect(ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE).toMatch(/not the signed architecture record/i);
  });
});
