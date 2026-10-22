> **Scope:** Paste-ready Composer prompts for how an operator reads, filters, and shares an inventory diagram that already contains connection evidence. Internal engineering only. **Prompts only** — do not implement from this page.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Prior consumption:** [`AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md) (**AX-DC**). **Card paint:** [`DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`](DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md) (**DFV**).
> **Paste files:** [`.cursor/prompts/diagram-consumption-ux-00-index.md`](../../.cursor/prompts/diagram-consumption-ux-00-index.md) (one numbered file per session).

# DCU-01–DCU-05 — Diagram consumption UX

**Observed (2026-10-03):** Authorization edges, stroke styles, the completeness banner, and the outline inspector are on the diagrams page. Clicking a painted connector clears focus. A second legend still says derived means inferred. Evidence families from `AzureInventoryDataFlowEvidenceCatalog` cannot be filtered. The downloaded PNG is the picture alone.

**Product framing (locked):** use the outline and SVG the page already has. **No new collectors.** **No Azure HTTP on click.** Do not promote authorization or hostname inference to observed traffic.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Click on `g.edge` clears focus | **DCU-01** | Auditors leave the canvas to find a row |
| Two legends; derived collapsed into inferred | **DCU-02** | **May access** reads as a guess |
| No family filter | **DCU-03** | Pipeline wiring and authorization paint as one story |
| PNG omits honesty and warning count | **DCU-04** | Shared slides drop the reading notes |
| Node focus omits the connector hint | **DCU-05** | A pulled-in Web App looks like any other card |
| New collection, second inspector, percents | **DCU-06** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **DCU-01** | First; parallel with 02 if legend lines stay untouched | Outline inspector on master |
| **DCU-02** | Parallel with 01 | Legend copy constants |
| **DCU-03** | After 01 | Outline `inferenceSource` |
| **DCU-04** | After 02 | Legend sentences |
| **DCU-05** | After 01 | Click-focus status line |
| **DCU-06** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/dcu-<short-name>`, plus the session suffix when agent instructions require one). Name the branch in any commit/push request.

## Shared constraints

- Plane wins. **No new Azure collection.** No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on test runs expected to exceed 15s.

## Related

| Document | Role |
|----------|------|
| [`AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md) | AX-DC — do not re-run |
| [`DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`](DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md) | DFV card paint — do not re-run |
| [`../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) | Family wording and ordinal bands |
