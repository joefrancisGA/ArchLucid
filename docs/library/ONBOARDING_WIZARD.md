> **Scope:** Operator first-run and trial surfaces (UI routes) — full detail in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Onboarding wizards (operator UI)

> **Install order moved.** See [INSTALL_ORDER.md](../INSTALL_ORDER.md). This page describes in-product routes only (week-one tasks after install).

## Canonical surface (2026 consolidation)

**Single operator FTUE route:** **`/getting-started`** — same **Core Pilot checklist** as **Home** (`OperatorFirstRunWorkflowPanel`), plus optional **trial / post-registration** UI (`GettingStartedTrialSection` → `OnboardingStartClient`: `GET /v1/tenant/trial-status`, deep link to **New run** with `trialSampleRunId` highlighted). Handoff after signup uses **`/getting-started?source=registration`**.

**Legacy bookmarks (HTTP redirect, query preserved on start):** **`/onboarding`**, **`/onboarding/start`**, and **`/onboard`** all **`redirect("/getting-started")`** (see `archlucid-ui/src/app/(operator)/onboarding/page.tsx`, `onboarding/start/page.tsx`, `onboard/page.tsx`). There is **no** separate four-step **`/onboard`** wizard in the shell anymore; first manifest work uses **`/runs/new`** and run detail like the checklist describes.

**Product metric:** the first successful manifest commit per tenant can increment **`archlucid_first_session_completed_total`** when SQL persistence and **`TenantOnboardingState`** are enabled (see [`docs/OBSERVABILITY.md`](OBSERVABILITY.md)).

**Navigation:** Core Pilot links live in `archlucid-ui/src/lib/nav-config.ts` (`tier`, `requiredAuthority`) composed with `nav-shell-visibility.ts`.
