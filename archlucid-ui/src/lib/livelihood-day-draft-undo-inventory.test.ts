import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH } from "@/lib/architecture/architecture-draft-document-undo";
import {
  LIVELIHOOD_DAY_DRAFT_UNDO_INVENTORY_DOC_PATH,
  LIVELIHOOD_DAY_DRAFT_UNDO_SURFACES,
} from "@/lib/livelihood-day-draft-undo-inventory";
import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-day draft undo inventory (LY-041)", () => {
  it("inventories in-tab draft undo, 300s toast, and forbidden unseal", () => {
    const scopes = LIVELIHOOD_DAY_DRAFT_UNDO_SURFACES.map((row) => row.scope);

    expect(scopes).toContain("in-tab");
    expect(scopes).toContain("governed-toast");
    expect(scopes).toContain("forbidden");
    expect(ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH).toBe(50);
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(LIVELIHOOD_DAY_DRAFT_UNDO_SURFACES.some((row) => row.notes.toLowerCase().includes("unseal"))).toBe(
      true,
    );
  });

  it("documents LY-041 inventory without claiming cross-refresh undo", () => {
    const doc = readFileSync(join(REPO_ROOT, LIVELIHOOD_DAY_DRAFT_UNDO_INVENTORY_DOC_PATH), "utf8");

    expect(doc).toContain("LY-041");
    expect(doc).toContain("LY-042");
    expect(doc).toMatch(/sessionStorage/);
    expect(doc).toMatch(/in-tab/i);
    expect(doc).not.toMatch(/cross-refresh undo is shipped/i);
  });
});
