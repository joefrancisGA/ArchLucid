import { describe, expect, it } from "vitest";

import { DURABLE_ACTION_OUTCOME_FORBIDDEN_TOAST_PHRASES } from "@/lib/durable-action-outcome-inventory";
import {
  DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS,
  DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES,
  DURABLE_MUTATION_GUARDED_SURFACE_PATHS,
} from "@/lib/durable-mutation-outcome-inventory";
import {
  DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS,
  listDurableOutcomeGuardedSourceRoots,
} from "@/lib/operator/durable-outcome-registry";

describe("durable outcome registry (TB-2116)", () => {
  it("derives guarded source roots from structured action-outcome surfaces", () => {
    expect([...DURABLE_MUTATION_GUARDED_SURFACE_PATHS]).toEqual(listDurableOutcomeGuardedSourceRoots());
  });

  it("keeps mutation dual-toast inventory aligned with the canonical registry", () => {
    expect([...DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS].sort()).toEqual(
      [...DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS].sort(),
    );
  });

  it("aliases mutation forbidden toast phrases to action forbidden toast phrases", () => {
    expect([...DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES]).toEqual([
      ...DURABLE_ACTION_OUTCOME_FORBIDDEN_TOAST_PHRASES,
    ]);
  });
});
