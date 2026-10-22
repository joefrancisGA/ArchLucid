# AX-DC-01 — Docs close-out (AX-DE shipped, AX-DC indexed)

**Wave:** AX-DC. **Depends on:** AX-DE-01–18 shipped on master. **Docs only** — no product code in this prompt unless a ratchet test references prompt paths.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

Close the documentation loop: **AX-DE collection is shipped**; **AX-DC consumption prompts are ready to run**. Operators and agents must not re-run AX-DE-01–18 or read “Recommended P0” as open collection work.

## Why

`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md` item 8 marks AX-DE Done, but `INFRA_EVIDENCE_COMPOSER_PROMPTS.md` still lists AX-DE as “prompts only / ready to run”. `AZURE_CONNECTION_POINT_DISCOVERY.md` §10 decision record still says **Recommended P0** for items that landed in AX-DE. Without close-out, the next agent session will collect again instead of consuming.

## Context

- [`docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../../docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) — mark **shipped (do not re-run)**
- [`docs/architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](../../docs/architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md) — this set (create if missing)
- [`docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../../docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) §10 — update statuses to **Shipped (AX-DE)** where applicable; point consumption gaps to **AX-DC**
- [`docs/architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS.md) — add AX-DC row; mark AX-DE shipped
- [`docs/architecture/README.md`](../../docs/architecture/README.md) — index AX-DC
- [`docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../../docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) — add item 9 for AX-DC consumption (prompts only until chats land)

## What to build

1. Update **AX-DE** composer doc header: **Shipped (engineering)** — do not implement from tables; do not re-run.
2. Ensure **AX-DC** composer doc + index exist and cross-link hold + discovery + AX-DE.
3. Revise **AZURE_CONNECTION_POINT_DISCOVERY.md** §10:
   - ARM platform wiring, MI+RBAC, app settings hosts, Service Connector → **Shipped (AX-DE-01–18)** with pointer to consumption gaps (**AX-DC-02–08**).
   - Keep Kudu / runtime graph rows as **Not planned** / **Infeasible**.
4. **INFRA_EVIDENCE_COMPOSER_PROMPTS.md**: add AX-DC table row; move AX-DE to “shipped — do not re-run”; add AX-DC-HOLD to “do not implement” table.
5. **README.md** architecture index: one bullet for AX-DC (ready to run).
6. **Technical backlog** item 9: diagram consumption (AX-DC-01–08); prompts only until implementation chats land.

Do **not** change C# unless a doc-link ratchet already exists and fails without a one-line path update.

## Acceptance criteria

- No doc still says AX-DE is “ready to run” without also saying **shipped / do not re-run**.
- Discovery §10 reflects shipped collection and names AX-DC for workbench/canvas gaps.
- AX-DC index is discoverable from INFRA_EVIDENCE_COMPOSER_PROMPTS and architecture README.

## Constraints

- Docs-only diff preferred. No collector changes. No `git add -A`.

## Done when

An agent reading only indexes understands: collection = AX-DE (closed); consumption = AX-DC (next).
