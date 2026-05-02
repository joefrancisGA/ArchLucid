> **Scope:** Sales-engineer / pilot-lead checklist for Core Pilot completion using existing operator UI and telemetry; not a substitute for customer success contracts.

# Core Pilot — sales-engineer workflow

**Audience:** Sales engineers and pilot leads guiding a prospect tenant through the **first architecture review** outcome.

**Companion:** [`docs/CORE_PILOT.md`](../CORE_PILOT.md), [`docs/go-to-market/DECISION_FAST_LANE.md`](../go-to-market/DECISION_FAST_LANE.md), [`docs/library/CHAMPION_48H_KIT.md`](../library/CHAMPION_48H_KIT.md).

---

## 1. Before the session

- Confirm **auth mode** (Entra / API key / staging bypass) and **simulator vs real** LLM expectation with the champion.
- Send Trust Center link: [`docs/trust-center.md`](../trust-center.md) if security is on the thread early.
- Optional: ask for **`baselineReviewCycleHours`** at trial signup — feeds value report (see [`docs/library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)).

---

## 2. During the session (operator Home)

1. Open **Home** — expand **First architecture review checklist (signals + steps)**.
2. Watch **Server-tracked onboarding signals**: Sessions, Finalized, Conversion. These are **process-lifetime** for the deployment (reset on API host restart) — use for **this environment’s** pilot drill, not as long-term CRM analytics.
3. Align **manual checklist toggles** in the sidebar **first-review checklist** with reality so champions see consistent ✓/○ state.
4. If the champion left mid-flow, the **Resume Core Pilot** banner (when shown) points to the **next** incomplete step from local checklist state.

---

## 3. Telemetry (what posts)

- **Checklist step acknowledgements:** `POST /v1/diagnostics/core-pilot-rail-step` with `stepIndex` **0–3** — increments `archlucid_core_pilot_rail_checklist_step_total` (Prometheus). Low-cardinality; safe for aggregate adoption dashboards.
- **No PII** in the telemetry body — do not paste customer narrative into diagnostic fields.

---

## 4. Definition of “done” for SE handoff

Minimum: **one** committed manifest on **customer-appropriate** inputs (not demo numbers in external decks). Sponsor artifact: first-value report / PDF path in [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md).

---

## 5. Related runbooks

[`docs/runbooks/PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) · [`docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)
