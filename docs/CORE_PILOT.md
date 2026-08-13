> **Scope:** First architecture review — shortest path from starting a new review to a finalized architecture package with findings, evidence, and sponsor exports. Consolidates the first-review guide and complete review workflow bodies (`FIRST_HOUR_OPERATOR_PATH.md` and `COMPLETE_REVIEW_WORKFLOW.md` remain path-stable contributor aliases).

# Your first architecture review

Use this guide with the [Pilot guide](/help/pilot-guide) to prepare for a pilot, interpret outputs, and get support contacts.

The home page shows your next recommended action after each review step.

For your first session, focus on completing **one** architecture review. Cloud connections, governance workflows, integrations, and reporting can wait until that review is finalized.

## First review path

Start with evidence, run the review, finalize the architecture package, then share sponsor-ready outputs.

- [Start architecture review](/architecture/reviews/new)
- [Open sample review](/architecture/reviews/claims-intake-modernization)
- [View pilot guide](/help/pilot-guide)

## Run the first review

1. **Start review** — open **New architecture review** and name what you want reviewed. Saving an architecture draft is optional and separate from starting a review. Choose a cloud target only when the review needs provider-specific mapping — otherwise select **No cloud / evidence-only**.
2. **Add evidence** — attach briefs, diagrams, documents, IaC, or exports. Add architecture context (goals, constraints, integrations) in the wizard when useful. Cloud connectors are optional.
3. **Run analysis** — execute the assessment on review detail until ready to finalize. Read findings — severity, business impact, rationale, and evidence citations — and use the evidence trail to trace each finding back to uploaded artifacts.
4. **Finalize package** — finalize the architecture package to lock the signed review record, findings, and export surfaces.
5. **Share outputs** — download sponsor exports and share proof with stakeholders.

## Complete review lifecycle {#complete-review-workflow}

Former complete review workflow depth for teams that need the full create → evidence → findings → decisions → finalize → export path (`COMPLETE_REVIEW_WORKFLOW.md` remains a path-stable contributor alias).

ArchLucid turns architecture evidence into a review with findings, decisions, evidence traceability, and export-ready artifacts.

### Overview

| | What you do | What ArchLucid does | What you get |
| --- | --- | --- | --- |
| **Purpose** | Provide evidence and context for one architecture decision | Evaluates design, records findings, and packages a signed review record | An architecture review you can export and share |
| **Typical duration** | One working session for a first review; longer when governance sign-off is required | Runs the assessment pipeline and attaches evidence citations | Findings, decisions, and sponsor-ready exports |

**Good to know:** You can start with briefs, diagrams, documents, or IaC only — cloud connectors for Azure, AWS, or GCP are optional accelerators. See [Pilot guide](/help/pilot-guide) to prepare.

### Resolve decisions and risks {#resolve-decisions-and-risks}

When governance is in scope for your workspace:

1. Review blocking or warning findings against your policy pack.
2. Record disposition decisions (accept, mitigate, defer, or reject) where your process requires it.
3. Complete any approval steps before finalize if your tenant enables governance workflow.

**Optional:** Skip deep governance on your first review — finalize when findings are understood and you are ready to share internally.

**What success looks like:** Material risks have an explicit disposition or approval path before external circulation.

### Export and share artifacts {#export-and-share-artifacts}

From review detail after finalize:

| Output | Use when |
| --- | --- |
| **Sponsor packet** | Executives or program sponsors need a shareable summary |
| **Sponsor summary** | ROI or disposition labels matter for the conversation |
| **Board pack / markdown exports** | You need editable narrative for internal review |
| **Audit export** | Compliance or security wants a scoped event CSV |
| **Email this review to your sponsor** | Your workspace enables one-click sponsor handoff |

**What success looks like:** Downloads succeed and labels clearly show whether cost or ROI figures are measured vs illustrative.

### Review states {#review-states}

ArchLucid uses a small set of labels on Home and review detail to show what to do next:

| State | Meaning | Typical next step |
| --- | --- | --- |
| **In progress** | Assessment running or findings not yet finalized | Stay on review detail until ready to finalize |
| **Ready to finalize** | Findings exist; signed record not locked yet | Finalize when disposition and evidence review are complete |
| **Finalized** | Architecture package is committed | Open exports and share with stakeholders |
| **Needs attention** | Blocking findings, stale evidence, or governance hold | Resolve blockers before sponsor send |

## Cloud connectors are optional for your first review

You can run an evidence-only review first, then connect Azure, AWS, or GCP later when source-system evidence is needed.

Cloud connectors are available for **Azure, AWS, and GCP** when live inventory, configuration, identity, policy, cost, or operational signals are required.

| Action | Where to go |
|--------|-------------|
| Connect cloud provider | [Cloud connections](/integrations/cloud-connections) |
| Security intake checklist | [Cloud connections guide](/help/cloud-connections) |
| Evidence-only upload | [Upload evidence](/settings/extract-upload) |

## Fast path: evidence-only review {#fast-path-evidence-only-review}

Recommended when connector access has not yet been approved, or when your first session only has briefs, diagrams, IaC, screenshots, exports, or policy documents.

1. Start a review with no cloud target selected (evidence-only).
2. Upload files or paste your architecture brief — a cloud connector is not required.
3. Run analysis, finalize the architecture package, and export the sponsor packet.

## What can wait

| Defer until later | Why |
|-------------------|-----|
| Compare, replay, and portfolio graph at scale | Not required to prove first review value |
| Advanced policy packs | Add when governance templates are in pilot scope |
| ITSM and chat connectors | Export handoff covers first value until workflow automation is needed |
| Cloud connections | Optional unless the first review needs live inventory |
| Governance workflows | Wait until an architecture review exists |
| Reporting depth | More useful after one or more reviews are finalized |

## What good looks like {#what-good-looks-like}

Success signals for a first session:

- The architecture review has clear findings.
- Important findings trace to evidence.
- Missing evidence is identified instead of guessed.
- Decisions are recorded when your workflow requires them.
- Risks or exceptions are created only when needed.
- The signed review record is understandable.
- The sponsor packet can be shared without embarrassment.

## Recommended first session {#recommended-first-session}

- Start with one real architecture artifact or open the sample review.
- Review the top findings.
- Confirm or add supporting evidence.
- Record at least one decision when the product prompts for it.
- Finalize the architecture package.
- Open the generated artifacts and sponsor exports.

## Ready to begin?

- [Start architecture review](/architecture/reviews/new)
- [Open sample review](/architecture/reviews/claims-intake-modernization)

<details>
<summary>What this guide covers</summary>

Guided path from an empty workspace to a finalized architecture package — evidence intake, running the assessment, finalizing findings, and sharing sponsor-ready exports.

</details>

<details>
<summary>When to use cloud connectors</summary>

Connect Azure, AWS, or GCP when the review needs live inventory or configuration-backed findings. Evidence-only reviews can proceed without connectors.

</details>

<details>
<summary>What can wait until later</summary>

Compare, replay, portfolio graph, advanced policy packs, and ITSM or chat connectors are available after your first finalized architecture package.

</details>

<details>
<summary>Related guides</summary>

| Need | Doc |
|------|-----|
| Pilot prep and support | [Pilot guide](/help/pilot-guide) |
| Review templates | [Specialty walkthroughs](/help/specialty-walkthroughs) |
| Wizard field reference | [Review guide](/help/review-guide) |
| Step-by-step evaluator orientation | [Choose your next step](/help/path-chooser) |
| First-session checklist in the product | [First review guide](/onboarding) |
| Governance when enabled | [Governance approval](/help/governance-approval) |

</details>

**Stuck?** [Troubleshooting](/help/troubleshooting) · [Pilot guide](/help/pilot-guide)
