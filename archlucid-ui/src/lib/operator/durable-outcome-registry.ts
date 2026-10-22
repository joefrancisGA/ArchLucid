/**
 * Canonical durable-outcome registry (TB-2116 consolidation).
 * Structured guarded surfaces stay in `durable-action-outcome-inventory.ts`;
 * flat path lists and dual-toast inventories are derived here so guards do not drift.
 */

import {
  DURABLE_ACTION_OUTCOME_DUAL_TOAST_TEST_PATHS,
  DURABLE_ACTION_OUTCOME_GUARDED_SURFACES,
} from "@/lib/durable-action-outcome-inventory";

/** Vitest guard files that assert the durable-outcome inventories themselves. */
export const DURABLE_OUTCOME_META_DUAL_TOAST_TEST_PATHS: readonly string[] = [
  "lib/durable-action-outcome-guard.test.ts",
  "lib/tb2116-durable-mutation-outcome-guard.test.ts",
] as const;

/** Full dual-toast regression inventory (surface tests + meta guard tests). */
export const DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS: readonly string[] = [
  ...DURABLE_ACTION_OUTCOME_DUAL_TOAST_TEST_PATHS,
  ...DURABLE_OUTCOME_META_DUAL_TOAST_TEST_PATHS,
] as const;

/** Unique operator source roots registered across structured guarded surfaces. */
export function listDurableOutcomeGuardedSourceRoots(): readonly string[] {
  const roots = new Set<string>();

  for (const surface of DURABLE_ACTION_OUTCOME_GUARDED_SURFACES) {
    for (const sourceRoot of surface.sourceRoots) {
      roots.add(sourceRoot);
    }
  }

  return [...roots].sort();
}
