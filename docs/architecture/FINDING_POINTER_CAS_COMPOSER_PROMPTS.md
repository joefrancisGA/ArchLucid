> **Scope:** Copy-paste Composer prompts that close **ADR 0076 current-pointer CAS** on every client write that can change a finding’s current disposition. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **CAS contract:** [`../library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`](../library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md) · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/finding-pointer-00-index.md`](../../.cursor/prompts/finding-pointer-00-index.md) (**FP-01–FP-24**)
> **Predecessor (wave 20 — livelihood-proof persist gates):** [`LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md`](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md) (**LP-01–LP-20**). **Do not re-run LP.** This set does **not** implement LP-19 (401 resume).

# Finding-pointer CAS Composer prompts (FP-01–FP-24)

**Created:** 2026-09-08 · **Status:** ready to run **after LP-01–18** (or in parallel except FP vs LP-17 on ITSM inbound, which already sends the pointer token) · **Do not re-run** LP, WS, DR, RS, or overlay waves except as an FP row names a leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. **ADR 0076** already fail-closes a racing second writer with **409** when `dbo.FindingCurrentDispositions.RowVersionStamp` does not match `expectedCurrentDispositionRowVersionBase64`. Keyboard triage already sends that token. The richest livelihood surface does not.

Paste **one** `.cursor/prompts/finding-pointer-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

The finding-inspect save — the surface where architects compose rationale, trade-off acknowledgments, apply-change attestation, and restatement — calls `recordFindingDisposition` **without** `expectedCurrentDispositionRowVersionBase64`. Under ADR 0076, once a current pointer exists the server **409s** a write that omits the expected version. Keyboard triage (`FindingKeyboardTriageHost`) sends the token. Inspect does not. Keyboard **undo**, the 24-hour **restore** button, and **bulk** SQL (`RecordBulkAsync` always passes `expectedCurrentRowVersion: null`) have the same hole.

That is not a cosmetic inconsistency. It is two doors into the same career write with different concurrency semantics. An architect who used inspect to record judgment can lose the amend, or silently fight the pointer, depending on whether a pointer already exists.

### Done test

After this wave:

1. Every `recordFindingDisposition` production call site sends `expectedCurrentDispositionRowVersionBase64` when a current pointer exists, or `undefined`/`null` only when history is empty (first disposition).
2. Inspect **submit** and **mark remediated** both send the token; 409 mounts `FindingDispositionConflictPanel`; retry adopts the winner’s version.
3. Keyboard undo and restore send the token.
4. Bulk HTTP + SQL + UI + cluster strip send per-finding expected versions; a pointer without a token **409s** (fail closed), not last-write-wins.
5. CI ratchet fails if a new call site omits the field.
6. First disposition (no pointer) still succeeds with a null expected version.

## Diagnosis → prompt

| Class | Prompts | Residual after ADR 0076 / RS-11 / LP-17 |
|-------|---------|------------------------------------------|
| Inventory | **FP-01** | Write paths not listed; contract PA table still says both HTTP calls succeed |
| Shared helper | **FP-02** | Inspect/keyboard/restore each invent version extraction |
| Inspect | **FP-03–09** | Payload has `latestDispositionRowVersionBase64`; hook never sends it |
| Other single writes | **FP-10–11** | Keyboard undo + restore omit the token |
| Ratchet | **FP-12** | New call sites can regress |
| Bulk | **FP-13–20** | HTTP body has no per-finding versions; SQL always `null`; facade drops inspect pointer |
| Honesty | **FP-21–23** | Missing-version C# tests, contract docs, NoOp/demo |
| Close | **FP-24** | Without audit, inspect save can drop the token again |

## Sequencing

See [`.cursor/prompts/finding-pointer-00-index.md`](../../.cursor/prompts/finding-pointer-00-index.md). **Inventory → helper → inspect → other singles → ratchet → bulk contract → bulk UI → close.**

**03** before **04/05**. **06** before **07**. **13 → 14 → 15 → 16** before **17**. **24** last.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- Sealed records stay immutable; a conflicting disposition is **amend**, not unseal.
- Collab remains recent disposition history, not live occupancy.
- LP-19 (401 resume / idempotency replay) stays in LP. This wave only attaches the CAS token.
- ITSM inbound already sends the pointer (LP-17) — do not rewrite that pipeline.

## Do not re-run

- **LP-01–20** — persist gates; this set owns only the inspect/bulk CAS leftover
- **DR-08 / RS-11** — 409 contract + keyboard conflict panel; inspect still unwired
- **WS-01–24** — Working seat chrome
