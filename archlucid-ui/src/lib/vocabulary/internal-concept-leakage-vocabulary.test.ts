import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  BUYER_VOCABULARY_BANNED_LITERALS,
  BUYER_VOCABULARY_LEAKAGE_SURFACES,
} from "@/lib/internal-concept-leakage-surfaces";

/**
 * Sibling of the IA-013 leakage guard: locks the commit→finalize buyer-vocabulary sweep
 * (docs/library/VOCABULARY_ROSETTA.md, 2026-08-03) against regression. Lives in its own
 * file because internal-concept-leakage-guard.test.ts had unstaged user edits when the
 * sweep landed.
 */
describe("buyer vocabulary leakage guard (VOCABULARY_ROSETTA)", () => {
  it("keeps swept buyer copy modules free of internal workflow verbs", () => {
    for (const relativePath of BUYER_VOCABULARY_LEAKAGE_SURFACES) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8");

      for (const literal of BUYER_VOCABULARY_BANNED_LITERALS) {
        expect(source, `${relativePath} must not contain "${literal}"`).not.toContain(literal);
      }
    }
  });

  it("uses finalize phrasing in sponsor dashboard copy", () => {
    expect(BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageNextStep).toBe(
      "Finalize at least one review to populate dashboard metrics.",
    );
    expect(BUYER_SPONSOR_SUMMARY_VOCABULARY.emptyStateTitle).toBe("No finalized reviews yet");
    expect(BUYER_SPONSOR_SUMMARY_VOCABULARY.metricsPreviewUnavailableFootnote).toBe(
      "Available after first finalized review",
    );
  });
});
