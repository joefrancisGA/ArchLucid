<!-- SecureNow probable-evidence Data Flow — Composer prompts.
     Origin: 2026-09-18 owner advice (relationship engine, evidence, confidence)
     plus engineering corrections (ordinal bands, no PE hop without DNS join,
     Service Bus/Event Hub are not ARM destinations).
     Do not implement from this index. -->

# SecureNow probable-evidence Data Flow — Composer prompt set (SN-PE-01–SN-PE-07 + hold)

The generator should not ask Azure to prove true runtime data flows. It should ask what **evidence** suggests data **could** or **does** flow, and stamp an **ordinal** confidence band. ArchLucid already collects most of that evidence (**AX-DE-01–18**, shipped). Executive/Identity/Data consumption is **AX-DC**. This set puts those families on **SecureNow Data flow** (Diagram 3) without collapsing them into “data flowed.”

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-probable-evidence-0N-*.md` file per Composer / Cloud Agent session.

Canonical design: [`docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](../../docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md). Wave doc: [`docs/architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md). Hold: [`docs/library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../../docs/library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

1. `DiagramDataFlowEdgeFilter` allow-lists only ADF/Synapse association types. `appAuthorizedAccess`, Event Grid destinations, Event Hub capture, KV refs, and hostname inference **exist on the graph** and never paint on Data Flow.
2. SN-DF-02 stage catalog omits App Service / Function / Event Grid / Service Bus / Event Hub, so even if the filter opened, those nodes would resolve to null and drop.
3. `privateDnsVnetLink` and `peDnsZoneGroup` are collected and **not joined**. Composing `appServiceToSubnet` + `privateEndpointTarget` without that join is a hub-spoke false-positive factory. Owner advice’s “95% Web App → SQL” is **wrong**.
4. Service Bus / Event Hub have no ARM record of producers/consumers. Capture is declared; Sender/Receiver RBAC is authorization. The role map today does not know those roles.
5. Numeric `"confidence": 80` is false precision. `ProvenanceKind` + `PathConfidenceBand` already exist (SA-21).
6. Direction is not a rendering detail: Contributor is **May access**; ADF I/O is **Reads from** / **Writes to**. Collapsing them is how Azure diagrams become terrible in a different way.

**This is not** AX-DE (collection) or AX-DC (Executive/Identity/Data). Do **not** re-run those as greenfield. Do **not** re-run SN-DF-01–08 as greenfield.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Families** | Ad hoc filter strings | Catalog: family + band + direction + label; **no percent field** | **SN-PE-01** |
| **Stages** | Apps/messaging omitted | Application + Event Grid + SB/EH on the stage catalog | **SN-PE-02** |
| **Data Flow edges** | ADF/Synapse only | Allow-listed declared / authorized / inferred / network-path families; hide diagnostics | **SN-PE-03** |
| **PE hop** | Unjoined facts | `peReachableTarget` only after DNS zone → **app VNet** link | **SN-PE-04** |
| **Messaging RBAC** | Unknown roles | Sender/Receiver → May write / May read | **SN-PE-05** |
| **Honesty** | ADF-only legend | Families + ordinal bands; no percents | **SN-PE-06** |
| **Contract** | No PE-negative fixture | Golden AST: ADF spine + May access + Event Grid; hub-spoke PE negative | **SN-PE-07** |

## What this set does *not* change

Keep: Network / Executive / Identity / Data modes (AX-DC owns Executive **May access**). SN-DF ADF spine. One Azure collector. Reader-only hosted. `flowchart LR` only if Data Flow already uses it.

Do **not** add collectors. Do **not** GET every resource id. Do **not** hide desktop review workspace tabs behind **More**. Do **not** mint Customer / Power BI. Do **not** put `diagnosticToDestination` on Data Flow.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **SN-DF-01–08** | Data Flow mode, stages, ADF spine, honesty | **Consume** |
| **AX-DE-01–18** | Collection | **Shipped — do not re-run** |
| **AX-DC-01–08** | Executive/Identity/Data consumption | **Do not re-run**; Data Flow is this wave |
| **IE-RF** | PE, VNet integration, DNS links | **Join** in SN-PE-04 |
| **SA-07** capability-to-flow | Path engines / findings | Do not claim packet flow; do not fork the engine |

## Run order

**01 → 02 → 03.** **04** after 01 (catalog type) and 03 preferred (so the hop can paint). **05** after 03 (role map + existing `appAuthorizedAccess`). **06** after 03. **07** after 03+04 (prefer 05–06 too). **08** is a written hold — not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-PE-01** Evidence family catalog | **First** | AX-DE catalog on trunk |
| **SN-PE-02** Application + messaging stages | After 01 | SN-DF-02 resolver |
| **SN-PE-03** Data Flow family filter + endpoints | After 01+02 | `DiagramDataFlowEdgeFilter` |
| **SN-PE-04** PE reachable DNS join | After 01; prefer after 03 | IE-RF associations on trunk |
| **SN-PE-05** Messaging RBAC direction | After 03 | `AzureInventoryRbacDataPlaneRoleMap` |
| **SN-PE-06** Honesty + ordinal bands | After 03 | SN-DF-04 legend |
| **SN-PE-07** Mermaid/AST contract | After 03+04 | SN-DF-07 shape |
| **SN-PE-HOLD** | Not implementation | — |

Suggested Cloud Agent branch per prompt: `cursor/sn-pe-<short-name>-3bd9`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/sn-pe-prompts-3bd9`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 00 | `securenow-probable-evidence-00-index.md` | This index |
| 01 | `securenow-probable-evidence-01-evidence-family-catalog.md` | Percent confidence; mixed arrow semantics |
| 02 | `securenow-probable-evidence-02-application-and-messaging-stages.md` | Apps/messaging drop off Data Flow |
| 03 | `securenow-probable-evidence-03-data-flow-evidence-families.md` | ADF-only `DiagramDataFlowEdgeFilter` |
| 04 | `securenow-probable-evidence-04-pe-reachable-dns-join.md` | Naive PE composition / 95% hop |
| 05 | `securenow-probable-evidence-05-messaging-rbac-direction.md` | SB/EH treated as ARM destinations |
| 06 | `securenow-probable-evidence-06-honesty-bands.md` | Legend still implies only ADF wiring |
| 07 | `securenow-probable-evidence-07-mermaid-contract.md` | Families can drift with no failing test |
| 08 | `securenow-probable-evidence-08-hold.md` | Written hold — not implementation |

## After each prompt

Summarize: files changed, tests run, whether Data Flow shows **May access** without VNet boxes, whether a second VNet-integrated app **without** a DNS link does **not** get `peReachableTarget`, Network mode unchanged, residual risk, SN-PE-HOLD still holds, AX-DE not re-touched.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Plane wins. One Azure collector. No `terraform apply` / ARM writes.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- **SecureNow** = Security product. **ArchLucid** = Architecture product + legal/company.
