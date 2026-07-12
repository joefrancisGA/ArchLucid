> **Scope:** Customer-facing — how finalized architecture reviews become searchable tenant memory for Ask and cross-run retrieval.

# Prior manifest retrieval

When you **finalize** a review, ArchLucid automatically indexes that review's decisions, findings, and manifest text into the retrieval corpus for your workspace project. Future Ask questions and agent runs in the same project can retrieve those chunks as **prior manifest** context — no manual "index this run" step.

## What gets indexed on finalize

Finalize triggers retrieval indexing for the current review package, including:

- **Manifest decisions and assumptions** — topology, security, compliance, and cost sections from the signed snapshot.
- **Findings** — severity, disposition, and evidence-backed recommendations from the finalized findings snapshot.
- **Prior manifests (cross-run)** — up to the configured limit of **other finalized reviews** in the same tenant, workspace, and project (see limits below).

Draft or in-progress reviews are **not** indexed until finalize succeeds.

## What makes a good prior

Prior chunks help Ask answer evolution and history questions when the underlying review is worth remembering:

| Signal | Why it helps |
| --- | --- |
| **Clear decisions recorded** | Topology and governance choices become retrievable anchors ("why did we choose private endpoints?"). |
| **Findings with dispositions** | Accepted, waived, or remediated findings give Ask concrete prior rationale. |
| **Complete evidence** | Reviews with attached diagrams, IaC, or connector inventory produce richer, citeable chunks. |
| **Intentional finalize** | Each finalize is a deliberate "this snapshot is authoritative" signal for tenant memory. |

## When priors add noise

Not every run improves Ask quality. Reduce noise by:

- **Avoid finalizing throwaway experiments** — abandoned what-if runs become searchable history unless archived.
- **Prefer the review you want cited** — duplicate near-identical finalizes crowd retrieval with redundant chunks.
- **Archive superseded reviews** — archived golden manifests are excluded from cross-run prior selection.
- **Stay in the right project** — priors are scoped to tenant + workspace + project; other projects do not share prior manifest chunks.

## Ask and prior-manifest intent

Ask retrieval ranks hits from multiple corpora (policy packs, platform docs, findings, prior manifests). When your question sounds historical — for example it mentions **prior**, **previous**, **earlier**, **why did**, or **over time** — Ask boosts prior-manifest hits so evolution questions surface committed decisions first.

Policy and compliance wording routes to policy-pack grounding instead; product how-to questions may lean on platform documentation. Prior manifests answer **your workspace's review history**, not generic best practices.

## Limits and configuration

Cross-run prior manifest attachment at index time is capped by `Retrieval:PriorManifest:MaxPriorManifestsPerIndex` (default **5**). Indexing selects the most recent finalized manifests in the same project, excluding the run being committed and any archived manifests.

Operators do not need to tune this for day-to-day pilots. Platform teams may adjust the limit in deployment configuration when large programs need deeper history windows.

## Related topics

- [Pilot guide](/help/pilot-guide) — first review workflow and outputs after finalize.
- [Findings](/help/findings) — dispositions and evidence that strengthen prior chunks.
- Engineering retrieval IR benchmarks for the PriorManifest corpus: `docs/quality/retrieval-ir-report.md`.
