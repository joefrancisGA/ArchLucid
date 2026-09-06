<!-- Defensible-record Composer prompts — paste one prompt per session.
     Origin: 2026-09-06 livelihood restatement after professional-core close
     (ArchLucid is a working-architect tool; all-day use; livelihoods may
     depend on the sealed record). Wave 16 after professional-core-00-index.md
     (PC-01–PC-13 shipped). Addresses remaining career-risk kernel gaps:
     false completeness, silent drops, default-off gates, crash/stuck runs,
     swallowed audit, disposition races, board-pack LLM, all-day desk.
     Do not implement from this index. -->

# Defensible-record mitigations — Composer prompt set (DR-01–DR-16)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

Wave 15 (**PC-01–PC-13**) shipped overlays and honesty: measurement floor *named*, BFF session, eval chrome eviction, architecture portfolio, seal delta, background wait, presenter→trail, grid amend, work-first keyboard, evidence naming, career-export sentences. Acceptance: `docs/architecture/PROFESSIONAL_CORE_ACCEPTANCE_2026-09-06.md`. **Do not re-run PC.** That audit said future kernel work must open a **new** set — this is that set.

This wave is **wave 16** — the Sept 2026 **career-defensibility** diagnosis: chrome and stamps can look professional while commit, execute, and audit still fail *open*. Paste **one** `.cursor/prompts/defensible-record-NN-*.md` file per Composer session.

**Do not implement from this index.** **Do not treat as a V1 assessment scorecard.** No GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## Diagnosis → prompt (maps to 2026-09-06 review)

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | **False completeness** | **DR-01** | Career export / finalize floor **fail closed** when measured engine count is null or unknown (PC-01 leftover) |
| 1 | **False completeness** | **DR-02** | Stripped LLM findings and merge-dedup conflicts are **desk items**, not silent drops |
| 1 | **False completeness** | **DR-03** | Advisory engine failures are first-class on the findings band; cannot omit from the package quietly |
| 2 | **Default-off gates** | **DR-04** | Working production-like hosts enable pre-commit governance gate; career export blocked when the gate is off |
| 2 | **Default-off gates** | **DR-05** | WarnOnly quality gate cannot screenshot as Ready / Decision-grade on Working real-mode |
| 3 | **Stuck / partial execute** | **DR-06** | Crash or lost lease cannot remain “In progress”; TB-943 execute ownership leftover |
| 4 | **Audit durability** | **DR-07** | ADR 0075 — coordinator audit echo fail-closed (or user-visible failed audit) |
| 4 | **Audit durability** | **DR-08** | ADR 0076 — concurrent finding dispositions conflict (409), not last-timestamp-wins |
| 4 | **Audit durability** | **DR-09** | Finding feedback and ask/conversation writes get durable `AuditEvents` rows |
| 5 | **Export career risk** | **DR-10** | Board-pack LLM narrative labeled advisory; Working download requires export verify |
| 6 | **All-day desk** | **DR-11** | Pin a second review context (compare pane) without collapsing desktop tabs |
| 6 | **All-day desk** | **DR-12** | Idle timeout preserves return URL + dirty-save; do not clear operator scope before persist |
| 6 | **All-day desk** | **DR-13** | Working findings/governance lists default to dense table + virtualize; last-visit filters restore |
| 3 | **Intake durability** | **DR-14** | Advisory-draft async operations leave in-memory singleton for a durable store |
| 1 | **False completeness** | **DR-15** | TB-1196 leftover: do not lift `ComplianceTags` from agent `Message` |
| 7 | **Room / hub** | **DR-16** | Room handoff on Working without requiring `?presenter=1` as the only path (PC-09 leftover) |

## Run order

**Fail-closed first:** **01 → 02 → 03 → 15** (what the package actually contains). Then **04 → 05** (gates). Then **06 → 14** (execute/intake durability). Then **07 → 08 → 09** (audit; 07/08 prefer ADR first). Then **10**. Then **11 → 12 → 13** (desk). Then **16** (room).

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **DR-01** | First | PC-01 shipped helper | PC-01 / PC-13 bodies; no 40th engine |
| **DR-02** | After **01** preferred | Emission gate TB-2222 | PC-08 wait chrome |
| **DR-03** | With **02** | `FindingEngineFailureCommitClassifier` | HOLD_NO_COVERAGE_ENGINES |
| **DR-04** | Independent of 01–03 | `PRE_COMMIT_GOVERNANCE_GATE.md` | Do not weaken PilotStrict on Staging/Production |
| **DR-05** | After **04** preferred | `AGENT_OUTPUT_EVALUATION.md` | Do not rewrite quality-gate floors |
| **DR-06** | Dedicated PR | TB-943 / crash claim map | PC-08 background copy |
| **DR-07** | ADR first | `AUDIT_COVERAGE_MATRIX.md` | Do not drop dual-channel baseline log |
| **DR-08** | ADR first | TB-986 contract | Do not lengthen 300s undo |
| **DR-09** | After **07** | Audit matrix known gap | Do not invent finding-comment chat |
| **DR-10** | After **01** | PC-13 honesty module | Fake transcripts; unseal |
| **DR-11** | Independent | PC-06 delta / Compare route | Desktop **More** menu; table merge |
| **DR-12** | After PC-03 BFF | LK-07 idle | Do not store Bearer in JS |
| **DR-13** | Independent | TB-935 / TB-1646 | Do not collapse review tabs |
| **DR-14** | Dedicated PR | `InMemoryAdvisoryDraftOperationStore` | Do not merge kernels |
| **DR-15** | With **02** | TB-1196 contract | Do not treat overlay as sealed |
| **DR-16** | After **09** preferred | PC-09 trail | Live presence / avatars |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- **Do not** hide desktop review tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs` tables. **Do not** unseal sealed records.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (ADR 0070 / IS-05).
- **Do not** add a 40th coverage-shaped engine or fake frontier transcripts (`HOLD_NO_COVERAGE_ENGINES.md`).
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS` (300).
- **Do not** invent live presence avatars, finding-comment chat, or per-architecture ACL (workspace scope stays ADR 0037).
- **Do not** re-run **PC-01–PC-13**. Name leftovers only.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary.
- Verification: focused Vitest + scoped C# tests; `.\scripts\ci\agent-compile-check.ps1` when C# changes.
- UI: Carbon density, sentence case, **TB-2005** form validation.
- New ADRs need Trade-offs, Constraints, and Expected impact. SQL in the single DDL file per database **and** a numbered migration. Infra in Terraform.

## Relationship to prior sets

| Set | Role |
|-----|------|
| **PC-01–PC-13** | **Shipped.** Honesty + desk chrome. This set owns **fail-closed leftovers** |
| **LK-05–07** | BFF shipped — DR-12 extends idle restore only |
| **CA-01–50** | Customer identity — do not merge tables |
| **TB-943 / TB-986 / TB-1196 / TB-2222** | Named contracts — implement leftovers, do not rewrite history |

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **which career-defensibility bet moved**, and which prior prompt (if any) this supersedes for execution.

## Prompt files (paste one per session)

| # | File |
|---|------|
| 01 | `defensible-record-01-floor-fail-closed-on-null.md` |
| 02 | `defensible-record-02-stripped-and-dedup-on-desk.md` |
| 03 | `defensible-record-03-engine-failures-first-class.md` |
| 04 | `defensible-record-04-precommit-gate-working-default.md` |
| 05 | `defensible-record-05-quality-gate-cannot-look-ready.md` |
| 06 | `defensible-record-06-crash-cannot-say-in-progress.md` |
| 07 | `defensible-record-07-adr-audit-echo-fail-closed.md` |
| 08 | `defensible-record-08-adr-disposition-conflict.md` |
| 09 | `defensible-record-09-finding-feedback-audit.md` |
| 10 | `defensible-record-10-board-pack-verify-and-advisory.md` |
| 11 | `defensible-record-11-pin-second-review-context.md` |
| 12 | `defensible-record-12-idle-preserves-desk.md` |
| 13 | `defensible-record-13-dense-lists-and-filter-resume.md` |
| 14 | `defensible-record-14-durable-advisory-operations.md` |
| 15 | `defensible-record-15-tb1196-no-message-compliance-tags.md` |
| 16 | `defensible-record-16-room-handoff-without-query-flag.md` |

