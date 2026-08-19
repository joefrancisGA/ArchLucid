# Trial funnel dashboard restructure

**Date:** 2026-07-13  
**Route:** `/admin/trial-funnel`  
**API:** `GET /v1/admin/operational/trial-funnel-summary?days={7-90}&comparePrevious={bool}`  
**Authorization:** `AdminAuthority`

## Funnel stage definitions

| Stage ID | Label | Qualifying event |
|----------|-------|------------------|
| `trial-started` | Trial started | `TrialSignupAttempted` |
| `first-review-finalized` | First review finalized | `TrialFirstRunCompleted` |
| `checkout-activity` | Checkout activity | `BillingCheckoutInitiated` or `BillingCheckoutCompleted` |
| `converted` | Converted | `TenantTrialConverted` or `TrialStatus = Converted` |

Stages without reliable separate telemetry (workspace configured, first architecture created, first review started without finalization) are **not** shown.

## Exclusion rules

- Demo/showcase tenant slugs from `AiUsageControls:PublicDemoTenantSlugs`
- Suspended or offboarded tenants
- Internal audit aggregation joins `dbo.Tenants` to filter slugs

## Conversion definition

Conversion counts trials with a `TenantTrialConverted` audit event during the selected window, aligned with `TrialStatus = Converted` on the tenant row.

## First-review AI cost

Estimated from `dbo.LlmMonthlyTenantBudgetState` (`SpentUsd + ReservedAssumedUsd`) for tenants with `TrialFirstManifestCommittedUtc` in the reporting window. Requires configured `LlmCostEstimation` input/output rates; otherwise status `rates-missing`.

## UI contract

Versioned in `archlucid-ui/src/lib/trial-funnel-metric-contract.ts` (`TRIAL_FUNNEL_METRIC_CONTRACT_VERSION`).

## Navigation

Listed under **Internal Operations → Trial funnel** (`showSystemAdministrationNav`). Route readiness tier: `admin-only`.
