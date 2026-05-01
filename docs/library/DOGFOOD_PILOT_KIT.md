> **Scope:** Internal dogfood pilot kit — run ArchLucid on ArchLucid-shaped work — full detail, tables, and worksheets in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Dogfood pilot kit (ArchLucid as subject)

**Audience:** ArchLucid product, engineering, and GTM teammates running an **internal** pilot where the system under review is internal architecture work (not a labeled customer deployment).

**Purpose:** Produce **real** baseline and pilot-outcome observations aligned to **[CORE_PILOT.md](../CORE_PILOT.md)** and **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** — then record them in **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** (**Pilot A** slot) **without inventing numbers**.

This is **not** a substitute for external design-partner pilots. It validates flow, tooling, and measurement hygiene before customer-facing scorecards.

---

## 1. Alignment to Core Pilot

Follow the **four steps** in **[CORE_PILOT.md](../CORE_PILOT.md)** §3 as the default lane:

1. Create architecture request  
2. Execute the run (pipeline completes)  
3. Commit the manifest  
4. Review manifest summary and artifacts (exportable package)

**Anti-creep:** Do not expand scope to advanced Operate layers for the first dogfood pass unless the pilot charter explicitly includes them. **[CORE_PILOT.md](../CORE_PILOT.md)** §1 explains what stays secondary.

**Subject matter:** Pick one **real** internal initiative (e.g. a subsystem, integration, or platform decision) that would normally get an architecture review package — not synthetic demo-only inputs unless you mark outcomes as **non-customer** and never copy demo numerics into **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** as if they were measured baselines (see **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** §4.1.1).

---

## 2. Baseline capture worksheet (before dogfood)

Ground in **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** §3 (especially §3.1–§3.2). Answer **qualitatively** first; add **hours or counts** only when you actually measured them (interview, ticketing, calendar, or comparable system of record).

| # | Prompt (from ROI model §3 spirit) | Your notes (words / ranges OK) | Numeric only if measured |
|---|-----------------------------------|-------------------------------|---------------------------|
| B1 | Current **elapsed time** from “request / brief” to “reviewable package” for one representative workflow | | |
| B2 | **Manual effort** to assemble narrative, manifest-like content, diagrams, evidence | | |
| B3 | **Difficulty explaining what changed** between two design versions (today’s process) | | |
| B4 | **Governance evidence** gaps — what gets reconstructed by hand before review | | |
| B5 | **Architect time split** — packaging vs design quality | | |

**Outputs:**  

- Copy **summaries** into your internal charter or **`PILOT_SUCCESS_SCORECARD.md`** appendix — not straight into **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** baselines unless the tracker row definitions match numerically.  
- For **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)**: leave **Baseline** as **TBD** until you have a defensible number or agreed **Unknown** per tracker §2.2; describe gaps only in **Notes**.

---

## 3. Outcome capture worksheet (after dogfood window)

Ground in **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** §4 and **§4.1** primary metrics table.

| Bucket | What to capture | Where it usually comes from |
|--------|-----------------|------------------------------|
| **Computed (when applicable)** | Time to committed manifest; findings totals/severity; LLM calls; audit row count bounds; evidence chain for top finding | First-value report / run detail / APIs described in ROI §4.1 |
| **Operator-judged** | Time to reviewable package; manual prep reduction; traceability; change visibility; governance evidence readiness | Interviews + short written assessment |
| **Secondary** | Onboarding friction, blockers, export usefulness, reviewer confidence | Pilot retro notes |

| # | Prompt | Your notes | Evidence link (internal) |
|---|--------|------------|---------------------------|
| O1 | **Time to committed manifest** for dogfood run(s) vs baseline B1 | | |
| O2 | **Findings** — total and whether mix felt defensible | | |
| O3 | **Cost / footprint** awareness (LLM calls, agreed envelope) | | |
| O4 | **Audit / observability** — enough rows to tell the story | | |
| O5 | **Qualitative bar** — did we meet ROI §5.1 minimum success? §5.2 strong? | | |

**Outputs:** Prefer **`PILOT_SUCCESS_SCORECARD.md`** synthesis first; then reflect **honest** **Result** cells in **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** only when values are **Captured** per tracker §2.2 (**TBD**, **Unknown**, **See scorecard**, or real numbers).

---

## 4. Updating **Pilot A** in PMF_VALIDATION_TRACKER.md (without inventing numbers)

**Allowed without PMF widening:**  

- **Notes** column for **Pilot A** rows — cite this kit, link scorecard, clarify internal dogfood vs external pilot.  
- **Status** transitions that match reality (**Pending** → **Captured** when qualitative or numeric evidence exists — see tracker §2.2).  
- **ICP score** / **ICP segment** when scored per **[IDEAL_CUSTOMER_PROFILE.md](../go-to-market/IDEAL_CUSTOMER_PROFILE.md)** (else leave **TBD**).

**Not allowed:** Fabricating **Baseline** or **Result** numerics to “fill the table.” If only qualitative signal exists, use **See scorecard** for **Result** and **Captured** **Status**, per **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** §2.2.

Hypothesis mapping (reminder):

| Tracker row | Typical bridge from dogfood |
|-------------|----------------------------|
| H1 | B1/O1 ↔ hours-per-review framing |
| H2–H3 | Governance / audit — only if pilot touched those workflows |
| H4 | Quality / explainability interview |
| H5 | Provisioning → first Core Pilot completion |

---

## 5. Related

- **[CORE_PILOT.md](../CORE_PILOT.md)** — operator path of record  
- **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** — baseline §3, during-pilot §4–§4.1, demo redaction §4.1.1  
- **[PMF_VALIDATION_TRACKER.md](../go-to-market/PMF_VALIDATION_TRACKER.md)** — **Pilot A** evidence rows  
- **[PILOT_GUIDE.md](PILOT_GUIDE.md)** — fuller pilot onboarding  
- **[PILOT_SUCCESS_SCORECARD.md](../go-to-market/PILOT_SUCCESS_SCORECARD.md)** — scorecard framing  
