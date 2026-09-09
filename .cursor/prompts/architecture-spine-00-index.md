<!-- Architecture-spine Composer prompts — paste one prompt per session.
     Origin: 2026-09-09 owner diagnosis — ArchLucid is a working-architect tool
     (all-day use; livelihoods may depend on the sealed record). Wave 22 after
     finding-pointer-00-index.md (FP-01–FP-24 shipped). Owns the ontology gap:
     diagrams + bound inventory as review inputs; semantic support as a career
     band; Career vs Rehearsal doors; optional architecture-scoped sharing.
     Do not implement from this index. -->

# Architecture-spine mitigations — Composer prompt set (AS-001–AS-100)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is wave 22.** Chrome, CAS, and persist gates (waves 1–21) are not enough. The remaining livelihood failure is **ontology**: the authority pipeline still treats architecture as extracted text, the seal is structurally cited but not semantically banded, Simulator can still look like unlabeled work, and a sensitive package is visible to the whole workspace.

**Owner authorization (this wave):**

1. Put **structured diagrams** and **bound inventory snapshots** on the review decide path (ADR **0084**). ESI inspect stays a separate surface.
2. Add a Working **semantic support band** (ADR **0085**). TB-1228 lanes stay — this is **not** a sync LLM commit gate.
3. Working **Career vs Rehearsal** doors (ADR **0086**). **Do not** flip host `AgentExecution:Mode` default. No G-REAL-06.
4. Optional **restrict-to-shares** per architecture (ADR **0087**). Amends the “no per-architecture ACL” V1 sentence. Does **not** replace ADR 0037. No SQL RLS. No live presence. No finding-comment chat.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/architecture-spine-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06. Do **not** paste IE-01–IE-22 collector bodies.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Diagrams on decide** | PNG/JPEG `return null`; authority MIME is text-only; ESI can open files engines never see | Structured parse (mermaid, vsdx, draw.io, SVG, PlantUML, product JSON) compiles into the review graph; pixels are NotVerifiable, not silent drops | AS-001–AS-045 |
| **Estate on decide** | Inventory is a parallel IE plane / unbound review looks like greenfield | Optional bind of an existing snapshot; ObservedFact merge; labeled gap if unbound | AS-046–AS-055 |
| **Semantic career band** | Empty EvidenceRefs fail-closed; a cited falsehood still looks Decision-grade | Supported / Unchecked / Unsupported / NotScored on Working; warn on finalize; optional PilotStrict hold default off | AS-056–AS-075 |
| **Career vs Rehearsal** | Simulator default day; Ready chrome can screenshot rehearsal | Explicit Working doors; Career cannot launder Simulator; host Mode default unchanged | AS-076–AS-085 |
| **Architecture shares** | Whole workspace sees every package | Opt-in RestrictToShares; View/Decide/Admin; grandfather open | AS-086–AS-099 |
| **Close** | Next intake PR drops PNG again | Acceptance audit | AS-100 |

## What this set does *not* change

Keep: tenant catalog isolation (ADR 0037) except the **optional** share intersection (0087); sealed-manifest immutability (ADR 0039); ADR 0068 two kernels — **do not merge** `DraftRequests`/`Runs`; density demotion predicate (ADR 0070); disposition 409 (ADR 0076); desktop review **tabs** as a full strip; Guided / demo / trial eval chrome; `MUTATION_UNDO_WINDOW_SECONDS = 300`; Simulator **host** default Mode; TB-1228 three faithfulness lanes (semantic is still not the default commit gate).

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** add a 40th coverage engine or “node type missing from diagram.” Do **not** invent live presence avatars or finding-comment chat. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** make vision/OCR default-on. Do **not** add a second Azure collector (IE plane owns collection).

## Out of wave (do not pretend closed)

| Residual | Why |
|----------|-----|
| Concurrent desk / work lease without presence | Problem 5 from the 2026-09-09 diagnosis — **wave 23** |
| Intake wizard + architecture-rename dirty-form guards | Still in LP-11 deferred inventory |
| Stop-analysis confirm | FP leftover; not a disposition write |
| Findings-queue list DTO row versions (N+1) | FP residual |
| IE-01–IE-22 collector/snapshot implementation | Bind consumes; does not ship the plane |
| G-REAL-06 Real-mode default host config | Owner/GTM |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 |

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **FP-01–24** | Wave 21 finding-pointer CAS | **Do not re-run.** |
| **LP-01–20** | Wave 20 persist gates | **Do not re-run.** Career honesty helpers may be *called*. |
| **ESI-01–08** | Evidence inspect/preview | **Do not re-run.** This wave *uses* catalog ids. |
| **IE-01–IE-22 / AE / BR** | Infra-evidence plane | **Do not paste.** Consume types; AS-046+ binds. |
| **DX-01–DX-68** | Insight density | **Do not re-run.** AS-053 wires DX-64 load; AS-066 forbids fusing the support band into the density gate. |
| **WS / SY / AO** | Working desk locator | **Do not re-run.** Nest new chrome on the architecture identity (ADR 0079). |

If a row lists an ESI/IE/LP/FP/DX owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Run order

**ADRs first (can parallel):** **001**, **056**, **076**, **086**.

Then **diagrams:** **002 → 003**. **006** after 003. Parsers **007–012** parallel after 006. **004 / 014** after 003 (PNG not dropped + catalog bind). **013** with 006. **016–023** after schema + at least one parser. Desk **024–030** after citations. Ratches **031–045** after the path they lock. **041** can start after 001.

**Inventory bind:** **046 → 047 → 048 → 049/050**. **051** after 046. **053** anytime after DX-64 (independent). **054–055** with 048.

**Semantic:** **056** then **057 / 059**; **060** after both; desk **061–075**.

**Rehearsal:** **076 → 077 → 078–085**.

**Shares:** **086 → 087 → 088**; then **089–099**.

**100 last.**

Suggested Cloud Agent branch per prompt: `cursor/as-<short-name>-c28a` is the *wave* branch for this prompt-set PR only. Implementation sessions use a **new** feature branch per prompt (`cursor/as-001-adr-0084-…`).

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `architecture-spine-001-adr-0084-architecture-kernel.md` | ADR 0084: diagrams and bound inventory are first-class review inputs | kernel-adr | none — run first |
| **002** | `architecture-spine-002-mime-kind-inventory.md` | Inventory intake MIME vs authority MIME vs stored-file kinds | diagram-inventory | AS-001 |
| **003** | `architecture-spine-003-context-ingestion-mime-contract.md` | Context ingestion MIME contract for structured diagrams | diagram-contract | AS-002 |
| **004** | `architecture-spine-004-png-jpeg-not-dropped.md` | Wizard must not return null for PNG/JPEG | diagram-intake | AS-003 |
| **005** | `architecture-spine-005-pixel-only-notverifiable.md` | Pixel-only attachments are NotVerifiable diagram sources | diagram-honesty | AS-004 |
| **006** | `architecture-spine-006-structured-diagram-schema.md` | Structured diagram document schema (nodes, edges, labels) | diagram-schema | AS-003 |
| **007** | `architecture-spine-007-mermaid-as-context-document.md` | Mermaid source as a review context document | diagram-parse | AS-006 |
| **008** | `architecture-spine-008-svg-sanitize-structured-parse.md` | SVG sanitize + structured parse (never execute as HTML) | diagram-parse | AS-006 |
| **009** | `architecture-spine-009-drawio-xml-parse.md` | draw.io / diagrams.net XML parse | diagram-parse | AS-006 |
| **010** | `architecture-spine-010-vsdx-zip-xml-parse.md` | Visio .vsdx zip+xml parse (no Visio COM) | diagram-parse | AS-006 |
| **011** | `architecture-spine-011-plantuml-c4-text.md` | PlantUML / C4 text as structured diagram | diagram-parse | AS-006 |
| **012** | `architecture-spine-012-archlucid-diagram-json.md` | ArchLucid diagram JSON ingest | diagram-parse | AS-006 |
| **013** | `architecture-spine-013-openapi-context-document-diagram.md` | OpenAPI: context documents may carry structured diagrams | diagram-wire | AS-006, AS-003 |
| **014** | `architecture-spine-014-wizard-images-bind-catalog.md` | Expert/Socratic wizard binds image files to the ESI catalog | diagram-intake | AS-004, ESI catalog (shipped) |
| **015** | `architecture-spine-015-esi-catalog-diagram-kind.md` | ESI inventoryKind distinguishes diagram-structured vs diagram-pixel vs citation | diagram-intake | AS-014 |
| **016** | `architecture-spine-016-authority-pipeline-accepts-diagram-json.md` | Authority pipeline compiles structured diagrams into the review graph | diagram-decide | AS-006, AS-013 |
| **017** | `architecture-spine-017-graph-from-structured-diagram.md` | Deterministic graph compile from AS-006 (label-only confidence < 1) | diagram-decide | AS-016 |
| **018** | `architecture-spine-018-bind-diagram-labels-to-canonical.md` | Bind diagram labels to CanonicalObject when inventory or IaC ids match | diagram-decide | AS-017, AS-043 optional parallel after AS-043 |
| **019** | `architecture-spine-019-unlabeled-box-notverifiable.md` | Unlabeled diagram boxes are NotVerifiable, not invented resources (R5) | diagram-decide | AS-017 |
| **020** | `architecture-spine-020-swimlane-trust-boundary.md` | Swimlanes / subgraphs become trust-boundary hints | diagram-decide | AS-017 |
| **021** | `architecture-spine-021-dataflow-arrows-graphedge.md` | Diagram connectors become GraphEdges with diagram provenance | diagram-decide | AS-017 |
| **022** | `architecture-spine-022-citation-kind-diagram-shape.md` | Evidence citation kind `diagram:` + shape id | diagram-cite | AS-016 |
| **023** | `architecture-spine-023-evidencerefs-from-diagram-shapes.md` | Typed engines may emit EvidenceRefs to diagram shapes they used | diagram-cite | AS-022 |
| **024** | `architecture-spine-024-inspect-jump-cited-shape.md` | Finding inspect jumps to the cited diagram shape | diagram-desk | AS-022, AS-025 can parallel after preview exists |
| **025** | `architecture-spine-025-preview-overlay-cited-shape.md` | Diagram preview can highlight a shape id | diagram-desk | AS-008/009/010 as available; can ship mermaid-first |
| **026** | `architecture-spine-026-multi-diagram-package-order.md` | Multiple diagrams have stable order and ids on the package | diagram-desk | AS-016 |
| **027** | `architecture-spine-027-diagram-revision-vs-architecture-version.md` | Diagram files are submitted evidence; they do not unseal or fork the architecture identity | diagram-desk | AS-014 |
| **028** | `architecture-spine-028-sealed-derived-graph-original-submitted.md` | Sealed snapshot holds derived graph; original bytes stay submitted evidence | diagram-seal | AS-016 |
| **029** | `architecture-spine-029-help-diagrams-structured-vs-pixels.md` | Help: structured diagrams are analyzed; pixels need extract | diagram-copy | AS-003 |
| **030** | `architecture-spine-030-operator-guide-vsdx-xml.md` | Operator guide: .vsdx parsed; .vsd unsupported; Visio app not required | diagram-copy | AS-010, AS-029 |
| **031** | `architecture-spine-031-vitest-png-not-dropped.md` | Vitest ratchet: PNG is not silently dropped from intake | diagram-ratchet | AS-004, AS-014 |
| **032** | `architecture-spine-032-csharp-mermaid-svg-ingest-tests.md` | C# ingest tests for mermaid and sanitized SVG | diagram-ratchet | AS-007, AS-008 |
| **033** | `architecture-spine-033-csharp-vsdx-fixture.md` | C# .vsdx fixture tests (zip-slip + shape text) | diagram-ratchet | AS-010 |
| **034** | `architecture-spine-034-golden-case-mermaid-topology.md` | Golden corpus case: mermaid-only topology | diagram-golden | AS-016, AS-007 |
| **035** | `architecture-spine-035-golden-case-vsdx.md` | Golden corpus case: vsdx structured topology | diagram-golden | AS-010, AS-034 |
| **036** | `architecture-spine-036-measurement-floor-diagram-extract-skipped.md` | Measurement floor: diagram extract skipped engines/sources | diagram-honesty | AS-005, AS-016 |
| **037** | `architecture-spine-037-career-export-diagram-sources.md` | Career export lists diagram sources and extract method | diagram-honesty | AS-028, AS-036 |
| **038** | `architecture-spine-038-ratchet-binary-extension-honesty.md` | CI ratchet: new binary extension needs extract or honesty row | diagram-ratchet | AS-002, AS-031 |
| **039** | `architecture-spine-039-pdf-image-only-no-fake-ocr.md` | Image-only PDF pages must not pretend text extraction succeeded | diagram-honesty | AS-005 |
| **040** | `architecture-spine-040-vision-opt-in-default-off.md` | Working opt-in vision extract (default off) — do not paste IE-20 | diagram-vision | AS-005, AS-003 |
| **041** | `architecture-spine-041-no-coverage-engine-missing-from-diagram.md` | Forbid a coverage engine ‘node type missing from diagram’ | diagram-hold | AS-001 |
| **042** | `architecture-spine-042-dangling-diagram-label-contradiction.md` | Dangling diagram refs vs declarations (contradiction, not coverage) | diagram-engine | AS-018, DX-24 shipped |
| **043** | `architecture-spine-043-bind-tf-arm-to-diagram-nodes.md` | Bind existing Terraform/ARM ingest nodes to diagram nodes | diagram-bind | AS-018 |
| **044** | `architecture-spine-044-architecture-desk-diagram-sources-strip.md` | Architecture desk shows diagram sources and extract status | diagram-desk | AS-015, AS-036 |
| **045** | `architecture-spine-045-r5-unlabeled-tests.md` | R5 tests: unlabeled and pixel-only never mint resources | diagram-ratchet | AS-019, AS-005 |
| **046** | `architecture-spine-046-bind-inventory-snapshot-contract.md` | Contract: architecture may bind an AzureInventorySnapshot (no second collector) | inventory-bind | AS-001 |
| **047** | `architecture-spine-047-sql-architecture-inventory-bindings.md` | SQL ArchitectureInventoryBindings (unified DDL + migration) | inventory-bind | AS-046 |
| **048** | `architecture-spine-048-api-attach-detach-snapshot.md` | API attach/detach inventory snapshot on an architecture | inventory-bind | AS-047 |
| **049** | `architecture-spine-049-ui-attach-inventory-snapshot.md` | Working desk: attach inventory snapshot control | inventory-bind | AS-048 |
| **050** | `architecture-spine-050-graph-merge-observedfact-from-snapshot.md` | Execute merges bound snapshot nodes as ObservedFact | inventory-bind | AS-016, AS-048 |
| **051** | `architecture-spine-051-honesty-no-snapshot-estate-gap.md` | Unbound architecture: labeled estate gap, not empty-cloud | inventory-bind | AS-046 |
| **052** | `architecture-spine-052-freshness-architecture-desk.md` | Bound snapshot freshness on the architecture desk | inventory-bind | AS-049 |
| **053** | `architecture-spine-053-dx64-prior-graph-working-default.md` | Working default: run topology-security-drift when a prior sealed graph exists | inventory-bind | DX-64 shipped |
| **054** | `architecture-spine-054-consume-ie-types-no-fork.md` | Ratchet: no second Azure collector types in this wave | inventory-bind | AS-046 |
| **055** | `architecture-spine-055-bind-authz-audit-idor.md` | Bind/unbind: authz, Required audit, IDOR tests | inventory-bind | AS-048 |
| **056** | `architecture-spine-056-adr-0085-semantic-support-band.md` | ADR 0085: semantic support is a Working career band, not a sync commit gate | semantic-adr | AS-001 (can parallel after 0084 exists) |
| **057** | `architecture-spine-057-heuristic-quote-overlap-scorer.md` | Heuristic quote-overlap support scorer (no LLM) | semantic-score | AS-056, AS-022 |
| **058** | `architecture-spine-058-async-support-ratio-job.md` | Async support-ratio job remains Lane B (optional enqueue) | semantic-score | AS-056 |
| **059** | `architecture-spine-059-support-band-enum.md` | Support band enum on the finding wire | semantic-wire | AS-056 |
| **060** | `architecture-spine-060-persist-band-overlay.md` | Persist support band as overlay, not a sealed-message mutation | semantic-wire | AS-059, AS-057 |
| **061** | `architecture-spine-061-working-desk-band-with-provenance.md` | Working findings desk shows support band beside provenance | semantic-desk | AS-059 |
| **062** | `architecture-spine-062-stamp-support-band-counts.md` | Stamp / finalize chrome includes support band counts | semantic-desk | AS-061 |
| **063** | `architecture-spine-063-sponsor-pdf-unsupported-visible.md` | Sponsor PDF cannot omit Unsupported decision-grade rows | semantic-desk | AS-062 |
| **064** | `architecture-spine-064-finalize-warn-unchecked.md` | Finalize warns on Unchecked decision-grade; does not block by default | semantic-gate | AS-059 |
| **065** | `architecture-spine-065-pilotstrict-optional-hold-unsupported.md` | PilotStrict Working Real may optionally hold on Unsupported (default off) | semantic-gate | AS-064, AS-056 |
| **066** | `architecture-spine-066-do-not-fuse-insight-density.md` | Support band must not be a DeterministicInsightDensityGate term | semantic-hold | AS-057 |
| **067** | `architecture-spine-067-honesty-ci-not-legal-truth.md` | Honesty CI: support band is not legal/semantic truth of the seal | semantic-hold | AS-056 |
| **068** | `architecture-spine-068-simulator-band-rehearsal.md` | Simulator: support band labeled rehearsal / NotScored as appropriate | semantic-honesty | AS-059, LP-06 |
| **069** | `architecture-spine-069-ask-inherits-band.md` | Ask answers that cite findings inherit the weakest support band | semantic-desk | AS-061 |
| **070** | `architecture-spine-070-restatement-does-not-reset-band.md` | Architect restatement does not reset support band to Supported | semantic-honesty | AS-060, LP-15 |
| **071** | `architecture-spine-071-export-json-includes-band.md` | JSON/ADR/print export includes support band | semantic-export | AS-059 |
| **072** | `architecture-spine-072-ratchet-decision-grade-shows-band.md` | CI: Working decision-grade UI shows band or NotScored | semantic-ratchet | AS-061 |
| **073** | `architecture-spine-073-tests-heuristic-mismatch.md` | C# tests: citation present but quote mismatch → Unsupported | semantic-ratchet | AS-057 |
| **074** | `architecture-spine-074-llm-judge-default-off.md` | LLM semantic judge stays default off for the band | semantic-hold | AS-058 |
| **075** | `architecture-spine-075-semantic-contract-doc-and-adr-index.md` | Semantic support band contract doc + ADR 0085 index completeness | semantic-close | AS-056–AS-074 as landed; this prompt may ship with 056 if 056 forgot the contract file |
| **076** | `architecture-spine-076-adr-0086-career-vs-rehearsal-doors.md` | ADR 0086: Working Career vs Rehearsal doors (no host Mode flip) | rehearsal-adr | none — can parallel AS-001 |
| **077** | `architecture-spine-077-working-chrome-mode-chooser.md` | Working chrome: Career / Rehearsal chooser | rehearsal-chrome | AS-076 |
| **078** | `architecture-spine-078-career-door-requires-real-or-blocked.md` | Career door requires Real or a blocked honesty state | rehearsal-chrome | AS-077 |
| **079** | `architecture-spine-079-cannot-screenshot-simulator-ready.md` | Rehearsal cannot screenshot as Ready to finalize | rehearsal-honesty | AS-077, LP-18 |
| **080** | `architecture-spine-080-new-working-tenants-career-intent.md` | New Working tenants default UI intent to Career (still no host flip) | rehearsal-chrome | AS-077 |
| **081** | `architecture-spine-081-guided-keeps-simulator-teaching.md` | Guided/demo/trial keep Simulator teaching; ratchet Working split | rehearsal-chrome | AS-077 |
| **082** | `architecture-spine-082-help-rehearsal-vs-career.md` | Help: rehearsal vs career in one topic | rehearsal-copy | AS-076 |
| **083** | `architecture-spine-083-cli-try-real-vs-rehearse.md` | CLI: try --real vs explicit --rehearse (no silent default Career) | rehearsal-cli | AS-076 |
| **084** | `architecture-spine-084-tests-career-rehearsal-chrome.md` | Vitest: Career vs Rehearsal chrome matrix | rehearsal-ratchet | AS-077–AS-081 |
| **085** | `architecture-spine-085-no-host-mode-flip-ratchet.md` | CI ratchet: this wave does not flip AgentExecution:Mode default | rehearsal-ratchet | AS-076 |
| **086** | `architecture-spine-086-adr-0087-architecture-share-acl.md` | ADR 0087: architecture-scoped sharing inside the tenant (does not replace 0037) | share-adr | none — can parallel AS-001; implement SQL after ADR exists |
| **087** | `architecture-spine-087-sql-architecture-shares.md` | SQL ArchitectureShares + RestrictToShares flag | share-data | AS-086 |
| **088** | `architecture-spine-088-grandfather-workspace-visible.md` | Grandfather: existing architectures stay workspace-visible | share-data | AS-087 |
| **089** | `architecture-spine-089-restrict-to-shares-opt-in.md` | Opt-in RestrictToShares on the architecture | share-api | AS-087 |
| **090** | `architecture-spine-090-view-vs-decide-vs-admin.md` | Share roles: View vs Decide vs Admin | share-api | AS-087 |
| **091** | `architecture-spine-091-idor-tests-restricted.md` | IDOR tests: restricted architecture is not readable by unshared workspace members | share-security | AS-090 |
| **092** | `architecture-spine-092-ui-share-panel.md` | Working desk share panel | share-ui | AS-089, AS-090 |
| **093** | `architecture-spine-093-audit-share-changes-required.md` | Share grant/revoke/restrict: Required durable audit co-commit | share-security | AS-089 |
| **094** | `architecture-spine-094-hub-list-honors-restrict.md` | Architectures hub and search honor RestrictToShares | share-ui | AS-091 |
| **095** | `architecture-spine-095-api-hidden-architecture-404-or-403.md` | Hidden architecture: consistent 404 (document the choice) | share-security | AS-091 |
| **096** | `architecture-spine-096-users-first-not-scim-groups.md` | V1 shares are users (oid); SCIM groups out of this wave | share-hold | AS-087 |
| **097** | `architecture-spine-097-no-sql-rls-ratchet.md` | Ratchet: ArchitectureShares must not introduce SQL RLS | share-hold | AS-087 |
| **098** | `architecture-spine-098-help-share-not-second-tenant.md` | Help: sharing is not a second tenant and not chat | share-copy | AS-086 |
| **099** | `architecture-spine-099-share-tests-and-openapi.md` | OpenAPI + full share API tests | share-ratchet | AS-048-style for shares; AS-087–AS-096 |
| **100** | `architecture-spine-100-wave-close-audit.md` | Wave close audit — architecture spine is decide-input, not inspect-only | close | AS-001–AS-099 as landed; evidence-only |

## Global constraints (every prompt)

See each file’s **Constraints**. In short: no desktop **More** menu; no merge of `DraftRequests`/`Runs`; no 40th engine; no finding-comment chat; no live presence; no Simulator **host** default flip; no G-REAL-06; no second Azure collector; vision default off; optional RestrictToShares is in-tenant only (no RLS); no GTM **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.
