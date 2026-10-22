> **Scope:** Customer-facing — Operator first-run and trial surfaces (UI routes) — full detail in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Onboarding wizards (architect workspace)

> **Install order moved.** See [INSTALL_ORDER.md](../engineering/INSTALL_ORDER.md). This page describes in-product routes only (week-one tasks after install).

## Canonical surface (2026 consolidation)

**Single operator FTUE route:** **`/architecture/first-review-guide`** (**ARF**) — same **Core Pilot checklist** as **Home** (`OperatorFirstRunWorkflowPanel`), plus optional **trial / post-registration** UI (`GettingStartedTrialSection` → `OnboardingStartClient`: `GET /v1/tenant/trial-status`, deep link to **New review** with `trialSampleRunId` highlighted). Handoff after signup uses **`/architecture/first-review-guide?source=registration`**.

**Retired hub:** **`/onboarding`** — no App Router page and no `next.config` redirect (see `LEGACY_ONBOARDING_PATH` in `archlucid-ui/src/lib/first-review-guide-route.ts`).

**Retired bookmarks (no App Router page or redirect shim):** **`/getting-started`**, **`/onboarding/start`**, **`/onboard`**, and **`/onboarding`** have no live route or `next.config` redirect — use **`/architecture/first-review-guide`** (ARF) directly. There is **no** separate four-step **`/onboard`** wizard in the shell anymore; first review-package work uses **`/reviews/new`** and review detail like the checklist describes.

**Product metric:** the first successful manifest commit per tenant can increment **`archlucid_first_session_completed_total`** when SQL persistence and **`TenantOnboardingState`** are enabled (see [`docs/OBSERVABILITY.md`](OBSERVABILITY.md)).

**Navigation:** Core Pilot links live in `archlucid-ui/src/lib/nav-config.ts` (`tier`, `requiredAuthority`) composed with `nav-shell-visibility.ts`.
