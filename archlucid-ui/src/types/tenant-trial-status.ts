/** Subset of `GET /v1/tenant/trial-status` used by operator trial banners and tenant settings. */
export type TenantTrialStatusPayload = {
  /** e.g. `Active`, `ReadOnly`, `ExportOnly` — see `TrialLifecycleStatus` on the API. */
  status?: string;
  /** Days until the next lifecycle boundary; for `ExportOnly`, days until hard purge. */
  daysRemaining?: number | null;
  /** Seeded sample review package id for trial onboarding CTAs when present. */
  trialSampleRunId?: string | null;
  /** First authority-committed manifest timestamp when the trial is anchored. */
  firstCommitUtc?: string | null;
  /** Pre-seeded welcome review package id used to deep-link a trial's first visit. */
  trialWelcomeRunId?: string | null;
  /** Signup-to-first-committed-manifest seconds; set only when `firstCommitUtc` is known. */
  timeToFirstCommittedManifestTotalSeconds?: number | null;
  /** Tenant-supplied median review-cycle hours captured at signup, when provided. */
  baselineReviewCycleHours?: number | null;
  /** Provenance note for `baselineReviewCycleHours`. */
  baselineReviewCycleSource?: string | null;
  /** When the baseline review-cycle answers were captured. */
  baselineReviewCycleCapturedUtc?: string | null;
};
