> **Scope:** Customer-facing — end-to-end architecture review workflow for customer architects.

# Complete review workflow

ArchLucid turns architecture evidence into a review with findings, decisions, evidence traceability, and export-ready artifacts.

Use this guide when you need the full lifecycle from starting a review through sharing outputs with sponsors, security reviewers, or governance stakeholders.

## Overview

| | What you do | What ArchLucid does | What you get |
| --- | --- | --- | --- |
| **Purpose** | Provide evidence and context for one architecture decision | Evaluates design, records findings, and packages a signed review record | A review package you can export and share |
| **Typical duration** | One working session for a first review; longer when governance sign-off is required | Runs the assessment pipeline and attaches evidence citations | Findings, decisions, and sponsor-ready exports |

**Good to know:** You can start with briefs, diagrams, documents, or IaC only — cloud connectors for Azure, AWS, or GCP are optional accelerators. See [Pilot guide](/help/pilot-guide) to prepare.

## Step 1: Create a review package

1. Open **New review** from Home or the reviews list.
2. Name the review so sponsors recognize the system and decision being evaluated.
3. Choose a cloud target only when the review needs provider-specific mapping — otherwise select **No cloud / evidence-only**.

**What success looks like:** A new review appears in your workspace with status progressing past created.

## Step 2: Attach architecture evidence

Upload the artifacts ArchLucid should evaluate:

- Architecture brief or description
- Diagrams, PDFs, or exports
- IaC snippets, policy documents, or screenshots
- Optional cloud inventory from a connector or approved laptop-side upload (Azure, AWS, or GCP)

Add architecture context in the wizard: goals, constraints, integrations, security concerns, and what you want reviewed. Context can stand in for files when you are early in design.

**What success looks like:** Evidence is attached and visible on review detail before or after assessment.

## Step 3: Review findings and evidence

1. Open the review on review detail and let the assessment complete.
2. Read findings — severity, business impact, rationale, and evidence citations.
3. Use the evidence trail to trace each finding back to uploaded artifacts.

**What success looks like:** Findings are available and the review is ready to finalize (or shows a clear failure message with a correlation identifier for support).

## Step 4: Resolve decisions and risks

When governance is in scope for your workspace:

1. Review blocking or warning findings against your policy pack.
2. Record disposition decisions (accept, mitigate, defer, or reject) where your process requires it.
3. Complete any approval steps before finalize if your tenant enables governance workflow.

**Optional:** Skip deep governance on your first review — finalize when findings are understood and you are ready to share internally.

**What success looks like:** Material risks have an explicit disposition or approval path before external circulation.

## Step 5: Finalize the review package

1. Open **Finalize** on review detail when the assessment is complete.
2. Confirm the signed review record and artifacts table appear.
3. Treat finalize as the lock point — exports and sponsor handoff use the committed package.

**What success looks like:** Review status shows finalized; the signed review record and artifact list are visible.

## Step 6: Export and share artifacts

From review detail after finalize:

| Output | Use when |
| --- | --- |
| **Sponsor packet** | Executives or program sponsors need a shareable summary |
| **Executive summary** | ROI or disposition labels matter for the conversation |
| **Board pack / markdown exports** | You need editable narrative for internal review |
| **Audit export** | Compliance or security wants a scoped event CSV |
| **Email this review to your sponsor** | Your workspace enables one-click sponsor handoff |

**What success looks like:** Downloads succeed and labels clearly show whether cost or ROI figures are measured vs illustrative.

## Review states

ArchLucid uses a small set of labels on Home and review detail to show what to do next:

| State | Meaning | Typical next step |
| --- | --- | --- |
| **In progress** | Assessment running or findings not yet finalized | Stay on review detail until ready to finalize |
| **Ready to finalize** | Findings exist; signed record not locked yet | Finalize when disposition and evidence review are complete |
| **Finalized** | Review package is committed | Open exports and share with stakeholders |
| **Needs attention** | Blocking findings, stale evidence, or governance hold | Resolve blockers before sponsor send |

## Related help

- [Pilot guide](/help/pilot-guide) — prepare for a pilot and get support
- [Your first architecture review](/help/core-pilot) — shorter first-session checklist
- [Start a review](/help/evidence-intake) — evidence intake on the new-review wizard
- [Review packages](/help/review-packages) — browse and inspect committed packages
- [Governance workflow](/help/governance-approval) — approvals when enabled
- [Troubleshooting](/help/troubleshooting) — symptom-first fixes
