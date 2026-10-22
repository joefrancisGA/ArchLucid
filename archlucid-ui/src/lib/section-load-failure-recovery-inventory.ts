/**
 * High-traffic sections whose load failure must offer a way to recover.
 *
 * Distinct from `error-recovery-contract-inventory.ts` (TB-2155), which guards *page-level* error
 * roots and accepts a full page reload as the retry. These are *section-level* failures inside an
 * otherwise working page: the page has a `refetch` / `reload` in scope, so the failure must offer a
 * scoped retry rather than bare red text that reads as "this section is empty".
 */

import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

/** Shared component plus the prop that actually renders its retry control. */
const SECTION_LOAD_FAILURE_MARKERS: readonly string[] = ["OperatorSectionLoadFailure", "onRetry"];

export const SECTION_LOAD_FAILURE_RECOVERY_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    id: "signed-records-list",
    sourceRoots: ["app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    id: "risk-exceptions",
    sourceRoots: ["components/governance/RiskExceptionsClient.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    id: "recurrence-schedules",
    sourceRoots: ["components/governance/RecurrenceSchedulesClient.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    id: "tenant-cost-settings",
    sourceRoots: ["app/(operator)/administration/workspace-settings/_sections/TenantCostSettingsCard.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    id: "cloud-connections-hub",
    sourceRoots: ["app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageClient.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    id: "sponsor-roi-trend",
    sourceRoots: ["app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiTrendSection.tsx"],
    requiredMarkers: SECTION_LOAD_FAILURE_MARKERS,
  },
  {
    // The picker popup cannot host OperatorSectionLoadFailure (it renders inside a listbox), so it
    // carries its own retry; the test id is what the guard can see from source.
    id: "run-id-picker",
    sourceRoots: ["components/runs/RunIdPicker.tsx"],
    requiredMarkers: ["run-id-picker-retry", "refetch"],
  },
] as const;
