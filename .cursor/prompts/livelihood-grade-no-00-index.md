<!-- Livelihood-grade-no mitigations — Composer prompt set (LN-001–LN-040) — paste one prompt per session.
     Origin: 2026-09-11 livelihood-desk diagnosis (all-day use; livelihoods may depend on the sealed record).
     Livelihood UX wave 26 — issue 3 after lost-write-00-index.md (LW-001–LW-100, issue 4).
     Do not implement from this index. -->

# Livelihood-grade-no mitigations — Composer prompt set (LN-001–LN-040)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/livelihood-grade-no-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** add a 40th engine. **Do not** turn LLM judge default-on. **Do not** implement G-REAL-06. Structural provenance (0082) stays; this wave is false-hard + extraction honesty.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `livelihood-grade-no-001-adr-0093-false-hard-citation-working-career.md` | ADR 0093: false-hard requires law citation on Working Career | kernel-adr | none — run first |
| **002** | `livelihood-grade-no-002-inventory-hard-infeasible-without-citation.md` | Inventory hard-infeasible without citation | inventory | LN-001 |
| **003** | `livelihood-grade-no-003-inventory-extraction-false-provenance.md` | Inventory extraction-to-finding provenance gaps | inventory | LN-001 |
| **004** | `livelihood-grade-no-004-false-hard-validator-working-career.md` | False-hard validator on Working Career persist/export | gate | LN-001, LN-002 |
| **005** | `livelihood-grade-no-005-extraction-source-passage-required-for-evidence-backed.md` | Extraction source passage required for evidence-backed | gate | LN-003 |
| **006** | `livelihood-grade-no-006-adversarial-fp-metric-on-desk.md` | Adversarial false-positive metric visible on Working | desk | LN-001 |
| **007** | `livelihood-grade-no-007-would-demote-honesty.md` | WouldDemoteIfUnprotected honesty on Working | honesty | LN-001 |
| **008** | `livelihood-grade-no-008-semantic-band-unchecked-warn-leftover.md` | Semantic Unchecked warn leftover on finalize | gate | LN-001 |
| **009** | `livelihood-grade-no-009-notverifiable-diagram-not-decision-grade.md` | NotVerifiable diagram shapes cannot be decision-grade leftover | gate | LN-003 |
| **010** | `livelihood-grade-no-010-dual-stream-named-ratchet.md` | Dual-stream named bands ratchet (LP-05) | ratchet | LN-006 |
| **011** | `livelihood-grade-no-011-case-65-golden-rerecord.md` | Golden case-65 DecisionGradeFusionFinding leftover | corpus | LN-001 |
| **012** | `livelihood-grade-no-012-gate-1-unknown-honesty-not-g-real-06.md` | Gate 1 UNKNOWN honesty — do not implement G-REAL-06 | honesty | LN-001 |
| **013** | `livelihood-grade-no-013-hard-vs-soft-on-exports.md` | Hard vs soft on career exports leftover | gate | LN-004 |
| **014** | `livelihood-grade-no-014-infeasible-is-a-product-not-error-page.md` | Infeasible is a product, not an error page leftover | desk | LN-013 |
| **015** | `livelihood-grade-no-015-heuristic-claimorigin-on-desk.md` | Heuristic ClaimOrigin leftover on LLM recs | gate | LN-006 |
| **016** | `livelihood-grade-no-016-open-questions-not-asserted.md` | Open questions not sealed facts leftover | honesty | LN-005 |
| **017** | `livelihood-grade-no-017-skipped-must-blocks-finalize-leftover.md` | Skipped MUST blocks finalize leftover | gate | LN-016 |
| **018** | `livelihood-grade-no-018-transparency-trail-null-blocks-leftover.md` | Null trail blocks finalize leftover | gate | LN-017 |
| **019** | `livelihood-grade-no-019-measurement-floor-known-count-leftover.md` | Measurement floor known count leftover | gate | LN-007 |
| **020** | `livelihood-grade-no-020-no-40th-engine-ratchet.md` | Ratchet: no 40th coverage engine | ratchet | LN-001 |
| **021** | `livelihood-grade-no-021-desk-false-hard-copy.md` | Desk copy for demoted hard→soft | desk | LN-004 |
| **022** | `livelihood-grade-no-022-sponsor-pdf-hard-citation.md` | Sponsor PDF hard citation leftover | export | LN-013 |
| **023** | `livelihood-grade-no-023-cli-infeasible-honesty.md` | CLI infeasible honesty | cli | LN-014 |
| **024** | `livelihood-grade-no-024-help-false-hard-vs-soft.md` | Help: hard vs soft infeasibility | copy | LN-001 |
| **025** | `livelihood-grade-no-025-do-not-implement-llm-judge-default-on.md` | Explicit skip: LLM judge default-on | out-of-wave | LN-008 |
| **026** | `livelihood-grade-no-026-do-not-implement-g-real-06.md` | Explicit skip: G-REAL-06 live packets | out-of-wave | LN-012 |
| **027** | `livelihood-grade-no-027-corpus-distribution-honesty.md` | Insight-density distribution is corpus, not Career | honesty | LN-011 |
| **028** | `livelihood-grade-no-028-findings-inspect-citation-chips.md` | Finding inspect citation chips leftover | desk | LN-005 |
| **029** | `livelihood-grade-no-029-openapi-feasibility-honesty-fields.md` | OpenAPI feasibility citation fields if added | contract | LN-004 |
| **030** | `livelihood-grade-no-030-csharp-tests-uncited-hard.md` | C# tests: uncited hard cannot export as hard | ratchet | LN-004 |
| **031** | `livelihood-grade-no-031-vitest-uncited-hard-ui.md` | Vitest: uncited hard UI not Career-hard | ratchet | LN-021 |
| **032** | `livelihood-grade-no-032-prompt-inventory-vitest.md` | Vitest: LN-00 index + LN-001–LN-040 files exist | close | prompt-set PR |
| **033** | `livelihood-grade-no-033-no-semantic-as-commit-gate.md` | Ratchet: semantic band is not default commit gate | ratchet | LN-008 |
| **034** | `livelihood-grade-no-034-help-extraction-fidelity.md` | Help: extraction fidelity is auditable | copy | LN-003 |
| **035** | `livelihood-grade-no-035-do-not-rewrite-0070-predicate.md` | Explicit skip: density predicate rewrite | out-of-wave | LN-007 |
| **036** | `livelihood-grade-no-036-restatement-does-not-mint-hard.md` | Architect restatement does not mint hard leftover | gate | LN-004 |
| **037** | `livelihood-grade-no-037-compare-hard-citation-delta.md` | Compare shows hard/soft citation delta | desk | LN-013 |
| **038** | `livelihood-grade-no-038-decision-receipt-infeasible.md` | Decision receipt for infeasible leftover | export | LN-014 |
| **039** | `livelihood-grade-no-039-support-triage-false-hard.md` | Support triage: false-hard vs soft | ops | LN-024 |
| **040** | `livelihood-grade-no-040-wave-close-audit.md` | Wave close audit — livelihood-grade no | close | LN-001–LN-039 |

## Run order

Follow **Depends on**. ADRs first. Inventories before mutating surfaces. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/livelihood-grade-no-<short-name>-5b6b`. Implementation sessions use a **new** feature branch per prompt. The prompt-set PR may live on `cursor/livelihood-gravity-prompts-5b6b`.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided, whether unlabeled Simulator Career is still possible on the path you touched (CG) or the wave’s done test.

**Successor:** [`mode-gravity-00-index.md`](mode-gravity-00-index.md) (**MG-001–024**).

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#.
