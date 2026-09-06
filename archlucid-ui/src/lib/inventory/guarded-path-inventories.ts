import type { InventoryPathSource } from "@/lib/inventory/inventory-path-source";

import { TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST } from "@/lib/button-classname-color-override-inventory";
import { CAREER_EXPORT_MOUNTED_UI_PATHS } from "@/lib/career-export-mounted-ui-paths";
import { CRAMPED_FORM_HELPER_STACK_INVENTORY } from "@/lib/cramped-form-helper-stack-inventory";
import { DURABLE_ACTION_OUTCOME_GUARDED_SURFACES } from "@/lib/durable-action-outcome-inventory";
import { ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES } from "@/lib/error-recovery-contract-inventory";
import {
  BUYER_VOCABULARY_LEAKAGE_SURFACES,
  INTERNAL_CONCEPT_LEAKAGE_SURFACES,
} from "@/lib/internal-concept-leakage-surfaces";
import { ADVISORY_DRAFT_IN_FLIGHT_SURFACES } from "@/lib/operations/advisory-draft-in-flight-inventory";
import { REVIEW_PIPELINE_IN_FLIGHT_SURFACES } from "@/lib/operations/review-pipeline-in-flight-inventory";
import { SECTION_LOAD_FAILURE_RECOVERY_SURFACES } from "@/lib/section-load-failure-recovery-inventory";
import { OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE } from "@/lib/operator/operator-inline-link-affordance-baseline";
import {
  INLINE_SUCCESS_CALLOUT_SURFACES,
  TOAST_ON_SUCCESS_SURFACES,
} from "@/lib/operator-success-feedback-contract";
import {
  TB_2288_DEFERRED_AD_HOC_PILL_MODULES,
  TB_2288_MIGRATED_MODULES,
} from "@/lib/status-pill-migration-inventory";
import { TIMESTAMP_TIMEZONE_BASELINE } from "@/lib/timestamp-timezone-baseline";

/**
 * Flattens the `sourceRoots` shape shared by the error-recovery style inventories. Typed
 * structurally so any inventory using that field can be registered without a new helper.
 */
function sourceRootPaths(
  surfaces: readonly { readonly sourceRoots: readonly string[] }[],
): readonly string[] {
  return surfaces.flatMap((surface) => surface.sourceRoots);
}

/**
 * Hand-maintained module-path inventories covered by `guarded-path-inventories.test.ts`.
 *
 * Add a source here whenever a new inventory of module paths appears. Only plain path lists
 * belong: inventories keyed by route, selector, or copy literal have nothing to resolve on disk
 * (for example `OPERATOR_SIDE_RAIL_INVENTORY.pathOrSurface`, which holds route paths).
 */
export const GUARDED_PATH_INVENTORIES: readonly InventoryPathSource[] = [
  {
    id: "TIMESTAMP_TIMEZONE_BASELINE",
    module: "lib/timestamp-timezone-baseline.ts",
    base: "src",
    paths: TIMESTAMP_TIMEZONE_BASELINE,
  },
  {
    id: "TB_2288_MIGRATED_MODULES",
    module: "lib/status-pill-migration-inventory.ts",
    base: "src",
    paths: TB_2288_MIGRATED_MODULES,
  },
  {
    id: "TB_2288_DEFERRED_AD_HOC_PILL_MODULES",
    module: "lib/status-pill-migration-inventory.ts",
    base: "src",
    paths: TB_2288_DEFERRED_AD_HOC_PILL_MODULES,
  },
  {
    id: "INLINE_SUCCESS_CALLOUT_SURFACES",
    module: "lib/operator-success-feedback-contract.ts",
    base: "src",
    paths: INLINE_SUCCESS_CALLOUT_SURFACES,
  },
  {
    id: "TOAST_ON_SUCCESS_SURFACES",
    module: "lib/operator-success-feedback-contract.ts",
    base: "src",
    paths: TOAST_ON_SUCCESS_SURFACES,
  },
  {
    id: "OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE",
    module: "lib/operator/operator-inline-link-affordance-baseline.ts",
    base: "src",
    paths: OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE,
  },
  {
    id: "TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST",
    module: "lib/button-classname-color-override-inventory.ts",
    base: "ui-root",
    paths: TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST,
  },
  {
    id: "INTERNAL_CONCEPT_LEAKAGE_SURFACES",
    module: "lib/internal-concept-leakage-surfaces.ts",
    base: "ui-root",
    paths: INTERNAL_CONCEPT_LEAKAGE_SURFACES,
  },
  {
    id: "BUYER_VOCABULARY_LEAKAGE_SURFACES",
    module: "lib/internal-concept-leakage-surfaces.ts",
    base: "ui-root",
    paths: BUYER_VOCABULARY_LEAKAGE_SURFACES,
  },
  {
    id: "ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES",
    module: "lib/error-recovery-contract-inventory.ts",
    base: "src",
    paths: sourceRootPaths(ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES),
  },
  {
    id: "SECTION_LOAD_FAILURE_RECOVERY_SURFACES",
    module: "lib/section-load-failure-recovery-inventory.ts",
    base: "src",
    paths: sourceRootPaths(SECTION_LOAD_FAILURE_RECOVERY_SURFACES),
  },
  {
    id: "REVIEW_PIPELINE_IN_FLIGHT_SURFACES",
    module: "lib/operations/review-pipeline-in-flight-inventory.ts",
    base: "src",
    paths: sourceRootPaths(REVIEW_PIPELINE_IN_FLIGHT_SURFACES),
  },
  {
    id: "ADVISORY_DRAFT_IN_FLIGHT_SURFACES",
    module: "lib/operations/advisory-draft-in-flight-inventory.ts",
    base: "src",
    paths: sourceRootPaths(ADVISORY_DRAFT_IN_FLIGHT_SURFACES),
  },
  {
    id: "DURABLE_ACTION_OUTCOME_GUARDED_SURFACES",
    module: "lib/durable-action-outcome-inventory.ts",
    base: "src",
    paths: sourceRootPaths(DURABLE_ACTION_OUTCOME_GUARDED_SURFACES),
  },
  {
    id: "CRAMPED_FORM_HELPER_STACK_INVENTORY",
    module: "lib/cramped-form-helper-stack-inventory.ts",
    base: "src",
    paths: CRAMPED_FORM_HELPER_STACK_INVENTORY.map((entry) => entry.componentOrModule),
  },
  {
    id: "CAREER_EXPORT_MOUNTED_UI_PATHS",
    module: "lib/career-export-mounted-ui-paths.ts",
    base: "src",
    paths: CAREER_EXPORT_MOUNTED_UI_PATHS,
  },
];
