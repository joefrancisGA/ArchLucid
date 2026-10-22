import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DESK_IA_NO_COLLAPSE_TABS_TEST_PATH } from "@/lib/desk-ia-no-collapse-tabs-ratchet";
import {
  INHABIT_NESTED_REVIEW_BACK_HREF_ROWS,
  INHABIT_FINDINGS_EDITOR_SURFACE_ROWS,
} from "@/lib/inhabit-leak-inventories";
import {
  INHABIT_POST_IR_INSPECTOR_SKIP_NOTE,
  INHABIT_POST_IR_INSPECTOR_SKIP_OWNER,
  INHABIT_POST_IR_LEAK_INVENTORIES_DOC_PATH,
} from "@/lib/inhabit-post-ir-leak-inventories";

const REPO_ROOT = join(process.cwd(), "..");

describe("inhabit post-IR inspector skip guard (IP-012)", () => {
  it("documents IP-012 skip in the post-IR inventory module", () => {
    expect(INHABIT_POST_IR_INSPECTOR_SKIP_OWNER).toBe("IP-012");
    expect(INHABIT_POST_IR_INSPECTOR_SKIP_NOTE).toMatch(/inspector/i);
    expect(INHABIT_POST_IR_INSPECTOR_SKIP_NOTE).toMatch(/intentional/i);
  });

  it("keeps peer governance queue returnsToArchitecture false (IR-015)", () => {
    const peerEditor = INHABIT_FINDINGS_EDITOR_SURFACE_ROWS.find((row) => row.editorKind === "governance-queue");
    const peerBack = INHABIT_NESTED_REVIEW_BACK_HREF_ROWS.find((row) =>
      row.relativePath.includes("GovernanceFindingsQueueClient"),
    );

    expect(peerEditor?.architectureIdKnown).toBe(false);
    expect(peerBack?.returnsToArchitecture).toBe(false);
  });

  it("keeps review-detail workspace tabs out of the More menu (DI-009)", () => {
    const testSource = readFileSync(join(REPO_ROOT, DESK_IA_NO_COLLAPSE_TABS_TEST_PATH), "utf8");

    expect(testSource).toMatch(/moreTabIds\)\.toEqual\(\[\]\)/);
  });

  it("records IP-012 skip in the post-IR inventory markdown", () => {
    const doc = readFileSync(join(REPO_ROOT, INHABIT_POST_IR_LEAK_INVENTORIES_DOC_PATH), "utf8");

    expect(doc).toContain("IP-012");
    expect(doc).toContain("job inspector");
  });
});
