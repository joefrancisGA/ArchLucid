> **Reviewed:** 2026-07-25

> **Scope:** Focused ~10-minute no-code usability test isolating one question — can a first-time principal architect find the sponsor-sendable export **after commit** without help? Market-validation operations; no UI changes until repeated failure clears the product decision gate.

# Sponsor export discovery test (focused micro-test)

**Audience:** Founder / facilitator running a quick post-commit export-discovery check.
**Last reviewed:** 2026-07-25

**Purpose:** The proof engine fails commercially if operators commit a review but cannot find what to
send. This test isolates the **commit → sponsor export** discovery moment so it can be measured quickly
(after Core Pilot path changes) without running a full 45-minute first-session observation.

**Reuse, do not duplicate:** this test inherits the taxonomy and discipline already shipped:

- Hesitation marker **H5** (cannot find export) and dismissal code **D4** (export / handoff hidden) — [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § dismissal-trigger taxonomy.
- Closing question "Would you send this to a sponsor as-is?" — [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md).
- Promotion + gate — [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Product decision gate.

For a full first-use evaluation, run the 45-minute protocol instead; this micro-test is the **scoped
regression** for the export moment only.

---

## Path under test (V1, shipped surfaces only)

Grounded in [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) **Phase D**:

| Step | Shipped affordance | Success signal |
| --- | --- | --- |
| Start state | A **committed** review exists (Phase C5 done; manifest id visible) | Review detail shows committed manifest + artifacts |
| D1b | **"Next after commit"** card — one **primary** action (sponsor packet) | Primary CTA scrolls to sponsor deliverables |
| D2 | **Export sponsor packet** (markdown/DOCX/PDF) **or** **"Email this review to your sponsor"** | Download/email succeeds; ROI basis label shows evidence source |
| Proof status | Run detail → **Proof status** strip (**READY / WARN / HOLD**) | Operator reads send/hold disposition correctly |

The participant starts on the **finalized review detail** screen. They are **not** told where the export
lives. Use the operator status vocabulary (READY/WARN/HOLD) — do not invent parallel labels.

---

## When to run

| Trigger | Action |
| --- | --- |
| After any Core Pilot path or review-detail change | Run this micro-test (1–3 participants) as a regression |
| Before scoping any export/handoff UI work | Run this first; only repeated failure justifies a change |
| Inside a full first-session cohort | Do not run separately — the 45-min protocol already covers H5/D4 |

**Repeated-failure rule:** Do **not** propose UI changes from a single failed participant. A change is
only eligible when failure repeats in **≥2** participants and the bottleneck clears the **product
decision gate** as **Justified now**.

---

## Setup (facilitator)

| Step | Done when |
| --- | --- |
| Staging/pilot stack, Core Pilot preset, buyer-default shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE` unset) | `/health/ready` green |
| One review already **committed** for the participant (you commit it; they start at review detail) | Manifest id visible on review detail |
| Timer + capture sheet open | Capture table below ready |
| Recording (if consented) | Started |

**One sentence of context (only):** "You've just finished a review — send it to your sponsor."
**Never say:** "sponsor packet", "export", "Email this review", "proof status", or point at the card.

---

## Task (participant-facing)

> "The review is committed. Get it to your sponsor the way you would in real life."

Time box: **10 minutes**. Facilitator intervenes only on safety/blockers, never on wayfinding.

---

## Capture (one row per participant)

| Field | Value |
| --- | --- |
| Participant label | `<pseudonymous>` |
| Time to export found (s) | (commit-screen → sponsor packet / email affordance opened) |
| Export found unaided | Y / N |
| Wrong turns (count + where) | e.g. opened Operate/compare, searched nav, opened audit |
| Terminology confusion (verbatim) | e.g. "What's a manifest? Is that what I send?" |
| H5 observed (cannot find export) | Y / N + timestamp |
| Would send as-is | Y / N + one reason |
| Read proof status (READY/WARN/HOLD) correctly | Y / N |
| Disposition | PASS / FAIL |

### PASS / FAIL (directional)

- **PASS:** participant opens the sponsor packet export or "Email this review to your sponsor" affordance
  **unaided within 10 minutes**, and correctly reads the proof-status disposition before sending.
- **FAIL:** cannot find the export unaided in 10 minutes (**H5**), or sends despite a **HOLD/WARN**
  disposition without acknowledging it (**D4** + label/trust risk).

---

## Rollup → product decision gate

After the participants, summarize and hand off — do **not** scope UI work here:

| Metric | Value |
| --- | --- |
| Export-found-unaided rate | /N |
| Median time-to-export-found (s) | |
| H5 (cannot find export) count | /N |
| Most common wrong turn | |
| Most common terminology confusion | |

**Gate handoff:** if H5 / D4 repeats in **≥2** participants, file it as a confirmed bottleneck and run it
through [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Product decision
gate. Only a bottleneck that clears as **Justified now** (design uncertainty, copy/UX-local) may open a
UI batch — for example, a single explicit "Send to sponsor / Export" affordance on the commit
confirmation, not an export-hub redesign.

---

## Related

- [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) — full cohort protocol + product decision gate
- [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) — 45-minute protocol + hesitation markers
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — Phase D export surfaces
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — GTM tracking (real run: `M-47`)
