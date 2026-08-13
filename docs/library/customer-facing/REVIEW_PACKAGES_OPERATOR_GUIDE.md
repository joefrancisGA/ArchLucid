> **Scope:** Customer-facing — browsing, inspecting, and exporting architecture packages in the architect workspace.

# Architecture packages

Browse, inspect, and export governed architecture packages in the architect workspace.

## What an architecture package contains {#what-an-architecture-package-contains}

An **architecture package** is the durable record for one architecture review. It typically includes:

- **Review metadata** — title, status, and workspace scope.
- **Findings** — evidence-backed architecture risks with severity and recommendations.
- **Evidence** — files and cloud inventory you attached during intake.
- **Policy evaluation** — results from the standards applied to this review.
- **Decisions and governance** — approvals, exceptions, and disposition when your workflow requires them.
- **Exports** — sponsor-ready summaries and proof packets after finalize.

Until you finalize, the package may still accept new evidence or decision updates depending on your role.

## Where to find your packages {#where-to-find-your-packages}

Open **Reviews** from the architect home or navigation to see architecture packages in your current workspace.

- **Recent reviews** on the home page surfaces packages you touched lately.
- **Reviews list** shows all packages in scope, with status and last activity.
- **Search** helps when you know the review title or identifier.

Select a row to open the architecture package detail view.

## Inspect an architecture package {#inspect-an-architecture-package}

The architecture package detail view is organized into tabs so you can focus on one concern at a time:

| Area | What you do there |
| --- | --- |
| **Overview** | See status, primary actions, and the fastest path to findings or finalize. |
| **Findings** | Read severity, rationale, and links back to supporting evidence. |
| **Evidence** | Confirm uploads, add files, and open export options. |
| **Policies** | Review which standards ran and how they scored. |
| **Decisions** | Record governance outcomes when your tenant uses approval workflows. |

Use **Review findings** when you need to triage risks. Use **Add evidence** if intake was incomplete before finalize.

## Export an architecture package {#export-an-architecture-package}

After analysis completes — and after finalize when your workflow requires it — export artifacts for sponsors, security reviewers, or auditors:

- **Proof packet** and architecture package exports from the **Evidence** tab.
- **Sponsor or sponsor summaries** when your tenant enables those outputs.
- **Signed review record** links when the architecture review has been finalized.

Exports are buyer-safe: they summarize outcomes without exposing raw engineering logs. Pick the format that matches your audience; you can regenerate exports from the same package while it remains open.

## Related guides {#related-guides}

- [Review guide](/help/review-guide) — how the New architecture review wizard maps to a package.
- [Start a review](/help/evidence-intake) — evidence formats and intake verification.
- [Findings](/help/findings) — respond to architecture risks inside a package.
- [Evidence graph](/help/evidence-trail) — trace a finding back to source artifacts.
- [Governance approval](/help/governance-approval) — approval and exception workflows.
