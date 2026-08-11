> **Scope:** Customer-facing field reference — what each step of the New architecture review wizard (/architecture/reviews/new) asks for and why.

# Review guide

Use this page while you work through the **New architecture review** wizard. The default **Quick start** path is a single screen; you can also switch to guided questions or templates and imports. You can start from a saved architecture draft or attach evidence directly in the wizard — both paths use the fields below.

This field reference describes the New architecture review wizard — it is product help, not a signed review record or a finalized architecture review export. Match labels and requirements to the live wizard before treating a printed copy as procurement evidence.

## Name the review

| Field | Required | What ArchLucid does with it | Common mistake |
| --- | --- | --- | --- |
| Review title | Required | Becomes the review name sponsors and reviewers see in lists, notifications, and the architecture package. | Vague titles such as "Test review" that do not identify the system or decision. |

## Upload architecture evidence

| Field | Required | What ArchLucid does with it | Common mistake |
| --- | --- | --- | --- |
| Attach architecture evidence | Conditional | Required without architecture context. Stores diagrams, exports, and documents as evidence for findings and the evidence trail. | Attaching unrelated files or skipping evidence when the architecture context is too thin. |
| Accepted file types | Not applicable | PDF, DOCX, Markdown, plain text, JSON, YAML, and common image formats. | Uploading proprietary formats ArchLucid cannot parse — see [Evidence intake: accepted formats](/help/evidence-intake) for ZIP and cloud-inventory rules. |

## Add architecture context

| Field | Required | What ArchLucid does with it | Common mistake |
| --- | --- | --- | --- |
| Architecture context | Conditional | Required without evidence (minimum 100 characters). Feeds goals, constraints, risks, integrations, and review focus into analysis when files are missing or thin. | One-line placeholders that do not explain what should be evaluated. |

## Confirm review scope

By default, your first review is evaluated against six architecture-quality standards — Security Architecture Baseline, Reliability and Resilience, FinOps & Cloud Cost Optimization, Performance and Scalability, Operational Excellence, and Sustainability and Resource Efficiency. Open **Review standards selection** to turn this off and use every standard enabled for your workspace instead.

| Standard | What ArchLucid evaluates |
| --- | --- |
| Security Architecture Baseline | Identity, data protection, and security controls for the design. |
| Reliability and Resilience | Failure modes, recovery, and operational continuity. |
| FinOps & Cloud Cost Optimization | Cost drivers, waste, and right-sizing opportunities. |
| Performance and Scalability | Latency, throughput, and growth headroom. |
| Operational Excellence | Operability, observability, and operational procedures. |
| Sustainability and Resource Efficiency | Resource efficiency and environmental impact of the design. |

| Field | Required | What ArchLucid does with it | Common mistake |
| --- | --- | --- | --- |
| Review standards selection | Optional | Focused scope on by default. Limits the first review to the six standards above, or widens evaluation to every standard enabled for your workspace. | Confusing review scope (which standards run) with workspace or tenant scope — see the [Workspace and scope guide](/help/scope). |

Review scope controls which standards evaluate your design; it is not the same as workspace or tenant scope. See the [Workspace and scope guide](/help/scope) for tenant, workspace, and project isolation.

## Start the review

| Field | Required | What ArchLucid does with it | Common mistake |
| --- | --- | --- | --- |
| Start an architecture review | Not applicable | Primary action. Creates the architecture package and begins evaluation when the title and evidence or context rules are met. | Selecting start before a review title is set or before evidence or sufficient context is provided. |

## Review findings and evidence

After analysis completes, open the architecture package to triage findings, severity, and evidence links — see [Findings](/help/findings).

## Finalize the architecture package

When decisions are ready, finalize and export sponsor-ready outputs from the architecture package — see [Architecture packages](/help/review-packages).

## Related guides

- [Evidence intake: accepted formats](/help/evidence-intake)
- [Architecture packages](/help/review-packages)
- [Evidence graph](/help/evidence-trail)
- [Findings](/help/findings)
- [Your first architecture review](/architecture/first-review-guide)
- [Workspace and scope guide](/help/scope)
