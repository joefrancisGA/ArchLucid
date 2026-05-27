> **Scope:** Unified onboarding and evaluation guide for buyers and operators. Replaces the former `BUYER_FIRST_30_MINUTES.md` and `CORE_PILOT.md`.
> **Hub:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid Evaluation Guide

**Audience:** Prospective buyers, evaluators, operators, and design partners completing their first pilot.
**Purpose:** Define the end-to-end journey from an empty tenant to a reviewed, exportable **architecture review package**.

> **Operators with a local or hosted install:** start at **[`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)** (single canonical path). This guide adds depth; it does not replace that checklist. **Stuck mid-pilot:** [`runbooks/FIRST_PILOT_TROUBLESHOOTING.md`](../runbooks/FIRST_PILOT_TROUBLESHOOTING.md).

## Part 1: Your first 30 minutes (Buyer / Evaluator path)

ArchLucid is a SaaS product. You will not install anything to evaluate it. Evaluating the product itself happens on the hosted SaaS at [`archlucid.net`](https://archlucid.net). There is no Docker, SQL, .NET, Node, Terraform, or CLI on the buyer path.

### What 30 minutes looks like

Five steps. Roughly thirty minutes end-to-end on a normal connection.

1. **Sign in.** Open [`archlucid.net`](https://archlucid.net) and sign in with your work identity. 
2. **Pick a vertical.** Choose the closest match (`financial-services`, `healthcare`, `public-sector`, `retail`, `saas`). The vertical sets default compliance rules, terminology, and analysis priorities.
3. **Try a sample.** ArchLucid pre-populates a sample architecture request shaped for the vertical you picked, then runs the analysis pipeline. No upload required for the first **review pass**.
4. **Read your first finding.** Open the finalized **review** and read the first typed finding — what was flagged, why it was flagged, what evidence backs it.
5. **Decide what to do next.** Either invite a colleague and run a second sample, or hand off to a guided pilot (Part 2 below).

## Part 2: Core Pilot (Operator path)

The Core Pilot path is **four steps** to produce a committed **golden manifest** and a downloadable **artifact bundle** with your own inputs.

```text
1. Create architecture review
      ↓
2. Pipeline runs  (coordinator fills steps automatically)
      ↓
3. Finalize / commit manifest
      ↓
4. Open review package (manifest summary and artifacts)
```

### Zero-config sample first
On the operator Home page, **Start with sample review** opens the curated Claims Intake sample review package. Use it to understand the destination before filling out the real-input wizard.

### Step 1 — Create an architecture review
**Operator UI:** Sidebar → **New review** (wizard; legacy nav may still show *New run* / `/runs/new`).
**CLI:** `archlucid run` (reads `archlucid.json` + `inputs/brief.md` — CLI verb unchanged).

### Step 2 — Execute the review
After creation, the coordinator fills context snapshots and authority steps automatically. 
**Check status:** Operator UI → **Reviews** (or **Runs** in legacy labels) → open the row → Pipeline timeline.

### Step 3 — Commit the manifest
Commit produces the **golden manifest** and synthesizes **artifacts**. Nothing is reviewable, exportable, or comparable before this step.
**Operator UI:** Review detail → **Commit** / **Finalize** (button label may show *Commit run* in some builds).

### Step 4 — Open the review package
**Operator UI:** Review detail (after commit) shows Manifest summary, Artifacts table, and Bundle ZIP.

### Step 5 — Same four steps with **your** inputs
After `archlucid try`, the lowest-friction real second **review** is a **one-page** `SECOND_RUN.toml` file plus a single CLI command — see **[`SECOND_RUN.md`](../library/SECOND_RUN.md)** for the full template, limits, and auth notes.

## What to evaluate in a Core Pilot
At the end of the four steps, answer:
1. Does the architecture request capture our system description accurately?
2. Are the findings (topology, cost, compliance, quality) relevant and plausible?
3. Is the manifest structure clear and the artifact content useful?
4. Does the governance pre-commit gate behave correctly for our finding severity thresholds?
