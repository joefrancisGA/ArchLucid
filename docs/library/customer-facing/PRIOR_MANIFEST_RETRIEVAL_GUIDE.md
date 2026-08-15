> **Scope:** Customer-facing — how finalized architecture packages become searchable tenant memory for Ask and later reviews.

# Prior manifest retrieval

When you **finalize** an architecture package, ArchLucid automatically indexes that package’s decisions, findings, and sealed review record text into the retrieval corpus for your workspace project. Future Ask questions and later reviews in the same project can retrieve those chunks as **prior** context — no manual index step.

## What gets indexed on finalize

Finalize triggers retrieval indexing for the current architecture package, including:

- **Decisions and assumptions** — topology, security, compliance, and cost sections from the sealed review record.
- **Findings** — severity, disposition, and evidence-backed recommendations from the finalized findings snapshot.
- **Priors from other packages** — up to the configured limit of **other finalized architecture packages** in the same tenant, workspace, and project (see limits below).

Draft or in-progress reviews are **not** indexed until finalize succeeds.

## What makes a good prior

Prior chunks help Ask answer evolution and history questions when the underlying review is worth remembering:

| Signal | Why it helps |
| --- | --- |
| **Clear decisions recorded** | Topology and governance choices become retrievable anchors ("why did we choose private endpoints?"). |
| **Findings with dispositions** | Accepted, waived, or remediated findings give Ask concrete prior rationale. |
| **Complete evidence** | Packages with attached diagrams, IaC, or connector inventory produce richer, citeable chunks. |
| **Intentional finalize** | Each finalize is a deliberate "this snapshot is authoritative" signal for tenant memory. |

## When priors add noise

Not every finalize improves Ask quality. Reduce noise by:

- **Avoid finalizing throwaway experiments** — abandoned what-if reviews become searchable history unless archived.
- **Prefer the package you want cited** — duplicate near-identical finalizes crowd retrieval with redundant chunks.
- **Archive superseded packages** — archived sealed review records are excluded from cross-package prior selection.
- **Stay in the right project** — priors are scoped to tenant + workspace + project; other projects do not share prior chunks.

## Ask and prior intent

Ask retrieval ranks hits from multiple corpora (policy packs, platform docs, findings, priors). When your question sounds historical — for example it mentions **prior**, **previous**, **earlier**, **why did**, or **over time** — Ask boosts prior hits so evolution questions surface finalized decisions first.

Policy and compliance wording routes to policy-pack grounding instead; product how-to questions may lean on platform documentation. Priors answer **your workspace’s review history**, not generic best practices.

<details>
<summary>Administrator details — indexing limits</summary>

Cross-package prior attachment at index time is capped by `Retrieval:PriorManifest:MaxPriorManifestsPerIndex` (default **5**). Indexing selects the most recent finalized packages in the same project, excluding the package being finalized and any archived records.

Architects do not need to tune this for day-to-day pilots. Platform teams may adjust the limit in deployment configuration when large programs need deeper history windows.

</details>

## Related topics

- [Pilot guide](/help/pilot-guide) — first review workflow and outputs after finalize.
- [Findings](/help/findings) — dispositions and evidence that strengthen prior chunks.
- [Architecture packages](/help/review-packages) — browse finalized packages.
