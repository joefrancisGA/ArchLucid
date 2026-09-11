import { describe, expect, it } from "vitest";

import { LOST_WRITE_MUTATION_ERROR_TOAST_INVENTORY } from "@/lib/lost-write-mutation-error-toast-inventory";
import { findLostWriteMutationErrorToastViolations } from "@/lib/lost-write-mutation-error-toast-guard";

describe("lost-write-mutation-error-toast-guard (LW-097)", () => {
  it("documents livelihood mutation toast surfaces", () => {
    const ids = LOST_WRITE_MUTATION_ERROR_TOAST_INVENTORY.map((row) => row.id);

    expect(ids).toContain("architecture-draft-save");
    expect(ids).toContain("architecture-share-grant");
    expect(ids).toContain("architecture-review-finalize-in-flight");
  });

  it("keeps inventoried mutation failure toasts on sticky helpers", () => {
    const violations = findLostWriteMutationErrorToastViolations(process.cwd());

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
