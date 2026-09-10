> **Scope:** Contributor-reference — wave 22 (AS-001–AS-100) close-audit evidence for architecture-spine: diagrams and bound inventory as review decide inputs, semantic support band, Career/Rehearsal doors, optional RestrictToShares schema. Not buyer-facing copy.

# Architecture-spine wave close audit (AS-100)

> **Date:** 2026-09-10 (wave 22 — AS-001–AS-100)  
> **Owner decision:** Diagrams and bound inventory are **decide inputs**, not inspect-only decoration. Semantic support is a Working **career band**, not a sync commit gate. Career vs Rehearsal is product chrome without flipping host `AgentExecution:Mode`.  
> **Spine:** [ADR 0084](adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md) · [ADR 0085](adrs/0085-semantic-support-band-not-sync-commit-gate.md) · [ADR 0086](adrs/0086-career-vs-rehearsal-doors-no-host-mode-flip.md) · [ADR 0087](adrs/0087-architecture-share-acl-inside-tenant.md) · [`ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md`](ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md)

## Verdict

**Shipped (data + honesty core + share ACL stack)** on branch `cursor/as-prompt-queue-close-97a4`. ADR 0084–0087 exist. PNG/JPEG are not silently dropped on intake. Structured diagram parsers (Mermaid, VSDX, ArchLucid JSON) compile into the review graph; pixel-only paths remain NotVerifiable. Semantic support band enum, Working chip, and mismatch tests landed. Career/Rehearsal chooser and Rehearsal Ready suppression landed. `RestrictToShares` SQL + grandfather default open landed with no SQL RLS. Share opt-in API (grant/revoke/restrict), list/get IDOR-safe filtering, audit events, OpenAPI snapshot, and Working desk share panel landed. Host `AgentExecution:Mode` default was not flipped. No second Azure collector was forked.

This audit does **not** claim IE collector implementation, G-REAL-06, or vision default-on.

## Headline gates (owner checklist)

| Gate | Shipped? | Evidence |
|------|----------|----------|
| ADR 0084 exists | Yes | `docs/architecture/adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md` |
| PNG not silently dropped | Yes | AS-004 MIME contract; context ingestion tests |
| Structured parser → review graph | Yes | AS-010/032/033 VSDX + Mermaid; golden cases 34–35 |
| Pixel-only NotVerifiable | Yes | AS-019 unlabeled box tests |
| Support band enum + chip + mismatch | Yes | AS-056–073; `semantic-support-band-desk-guard` |
| Career/Rehearsal + no unlabeled Ready | Yes | AS-076–081, AS-079; `run-pipeline-finalize-blocked-honesty.ts` |
| RestrictToShares opt-in schema + API | Yes | AS-087/088 SQL; AS-089–AS-099 API, tests, OpenAPI, desk panel | None |
| No host Mode flip | Yes | AS-085 ratchet; ADR 0086 |
| No second collector | Yes | ADR 0084 constraints; inventory bind reuses existing snapshots |

## Evidence table (by cluster)

| Prompt range | Shipped? | Evidence | Residual |
|--------------|----------|----------|----------|
| AS-001–AS-004 MIME / PNG honesty | Yes | ADR 0084; MIME inventory + context ingestion contract tests | None |
| AS-010–AS-021 diagram parsers | Yes | VSDX, Mermaid, PlantUML, diagram JSON; golden harness | Vision OCR default-off (AS-040) |
| AS-034–AS-035 golden topology | Yes | Golden corpus cases; distribution re-record | None |
| AS-046–AS-047 inventory bind | Yes | `378_ArchitectureInventoryBindings.sql`; API attach | None |
| AS-056–AS-073 semantic band | Yes | ADR 0085; overlay migration 379; mismatch tests | None |
| AS-076–AS-086 Career/Rehearsal + ADR 0087 | Yes | ADR 0086/0087; chooser, gate, preference, help AS-082, CLI AS-083 | None |
| AS-079 Rehearsal Ready suppression | Yes | `run-pipeline-finalize-blocked-honesty.ts`; RunStatusBadge wiring | None |
| AS-081 Guided keeps teaching | Yes | `OPERATOR_UI_EXPERIENCE_MODES.md`; AS-081 architecture + Vitest ratchets | None |
| AS-087–AS-088 share SQL + grandfather | Yes | `380_ArchitectureShares.sql`; `ArchitectureShareDdlArchitectureTests`; AS-088 list test | None |
| AS-097 no SQL RLS ratchet | Yes | DDL grep tests on migration 380 | None |
| AS-098 share help boundary | Yes | `/help/architecture-sharing`; AS-098 tests | None |
| AS-089–AS-099 share API/UI/OpenAPI | Yes | `ArchitecturesController.Shares`; `ArchitectureShareService`; `ARCHITECTURE_SHARE_ACL_CONTRACT.md`; desk panel AS-092 | None |
| AS-100 close audit | Yes | This file; `architecture-spine-prompt-inventory.test.ts` | None |

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| Concurrent desk / work-lease without presence | Wave 23 | ADR 0084 follow-up |
| Intake wizard dirty-guard | leftover | Named in wave index; not architecture-spine body |
| Stop-analysis confirm | leftover | Not a disposition write |
| Bulk list DTO row versions | leftover | Queue N+1 refetch |
| 300s undo length | leftover | Undo policy |
| Simulator → Real host default | G-REAL-06 | Do not flip |
| IE collector implementation | DX / IE plane | Consume types only in this wave |
| Vision default-on | AS-040 | Working opt-in only |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | Tech TB Done; GTM owner work |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | GTM V1.1 | Human-led validation |

## Do not claim

- G-REAL-06 fake Real runs or host Mode flip.
- Live presence or finding-comment chat.
- IE plane or second Azure collector shipped in wave 22.
