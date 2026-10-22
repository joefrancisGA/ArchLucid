# PC-02 — Intake MUST questions feed engines already in the golden corpus

**Do not fork ID-01–11** measurement reports. **Do not add a 40th coverage engine.** **Do not change** insight-density gate method.

## Goal

For Working intake, every **MUST** question that blocks finalize is mapped (in code + one help topic) to at least one **deterministic engine or parser** that exists in `GoldenCorpusHarness.CreateEngines()` or the built-in catalog. Skipped MUST still blocks seal (existing gate). **New:** when a MUST is unanswered, the UI names **which measurement will stay absent** — not only “required field missing.”

## Why

Raising decision-changing insight requires engines/parsers/intake — not relabeling. Casual evaluators ask generic questions; livelihood tools connect elicitation to **what will actually be measured** on seal. R7/R8: packs own questions; this prompt wires question → engine **coverage**, not new LLM generators.

## Context

- `SocraticIntakeWizard`, `DraftRequestDocument`, policy packs
- `DeclarationSignalPolicyPrefixFamily`, pack question→rule mapping (R8)
- `GoldenCorpusHarness.CreateEngines()`
- `AuthorityCommitSkippedMustGate`, transparency trail
- `docs/architecture/adrs/0048-socratic-intake-mutable-draft-lifecycle.md`

## What to build

1. Inventory: table or generated markdown (checked in) MUST questions × engine dependencies × in-harness boolean.
2. Product: for top blocking MUST gaps on Working, field-level hint cites engine family (“actor count affects … engine”).
3. No new engines — only intake validation, copy, and pack metadata wiring.
4. Vitest: a representative MUST shows engine hint when empty; finalize blocked copy mentions measurement gap when trail says skipped.

## Acceptance criteria

- An architect understands **why** a MUST matters for the sealed record’s analytical floor.
- Harness engine count unchanged unless an existing engine was already in catalog but unmapped (document only).

## Constraints

- Do not free-generate questions (R7 L2 bounded selector only).
- Guided may keep shorter hints.
