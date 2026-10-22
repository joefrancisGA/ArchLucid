# SN-QQ-02 — Emit a question only when the answer changes the next action

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-01. Do not rebuild the disposition store.

## Goal

`GET .../questions` for a snapshot returns one deduped list. Each row is a question a person can answer. A known missing link stays in the outline Problem column and does not become a question.

## Why

The outline already says "Missing a required link" and "Needs evidence." Most of those rows are facts: a subnet is gone, a parent is gone, nothing cites the resource. Asking the reader to confirm the fact does not change what SecureNow does next. The inference questionnaire is a third list. The reader should see one count.

## Read first

- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/InferenceQuestionnaireItemGenerator.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramQuestionableAttentionResolver.cs`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` (Problem column; leave it in place)
- `.cursor/prompts/node-relationship-12-unknown-questions.md`
- The SN-QQ-01 disposition type this session reads

## What to build

Add a compiler that runs when the snapshot question list is requested. It proposes questions, then joins SN-QQ-01 dispositions. Return the proposal even when no disposition exists, with status `Open`.

A proposal is included only when a person's answer would change a later action. Use these three sources in this session:

1. **Broken-link intent.** For an Orphaned node whose problem is a missing required relationship, emit at most one question per resource: "Is this still needed?" Answer codes: `Retire`, `Keep`, `NotSure`. Skip the node when the problem is only a deleted or absent Azure object and no keep-or-retire choice remains. A restore point whose parent is gone is that case. Leave it in the Problem column.
2. **Needs evidence.** For an Unknown node, emit one question only when the reader can name a peer or declare that the resource should stand alone. Answer codes: `NamePeer`, `StandsAlone`, `NotSure`. When the only honest sentence is the NR-12 empty-detail sentence, emit nothing.
3. **Inferred connection.** Project each still-proposed item from `InferenceQuestionnaireItemGenerator` into the same list. Source is `InferredConnection`. Do not copy the proposal into the SN-QQ-01 table. Confirm and dismiss stay on the existing operator-inferred service.

Questionable pack cards are **SN-QQ-05**. Do not emit them here.

Question key examples: `orphan-still-needed@v1`, `unknown-evidence@v1`, and the existing inference rule name plus `@v1` when that rule name has no version. One key per resource per kind.

Dedupe by the SN-QQ-01 identity. The same resource on two diagram modes is one row. Order the list by consequence: inferred proposals that name two resources, then broken-link intent for a resource that still exists, then needs-evidence. Stable sort after that by resource id.

Each row includes the plain question, a source line the UI can show (`Inventory evidence` or `Inferred connection`), the resource id when there is one, the answer codes, and the evidence fingerprint. Fingerprint is a stable hash of the question key, the normalized resource id, and the problem text or inference endpoints. This session returns the fingerprint. It does not reopen rows. That is SN-QQ-06.

Do not add a form to the Unknown table. Do not change NR-12 copy. Do not build the hero or the drawer.

## Tests

1. An orphaned restore-point collection whose parent no longer exists produces no question. The compiler test fixture still contains the problem text.
2. An orphaned resource that can be retired or kept produces one `orphan-still-needed@v1` question, not one question per missing relationship.
3. An Unknown resource with only the empty-detail sentence produces no question.
4. An Unknown resource the reader can connect or mark as standing alone produces one question.
5. Two diagram modes that contain the same resource id and question key produce one row.
6. A proposed inference item appears in the list with source `InferredConnection` and is absent from the disposition table until a later ignore is stored.
7. A node with questionable attention and no other gap produces no question in this session.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new compiler tests and the existing `InferenceQuestionnaireItemGenerator` tests.
- Do not commit.
- Do not write to customer Azure. Do not collect flow logs.
- Do not promote any row to `ObservedFact`.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The list for a snapshot contains intent questions, needs-evidence questions that a person can answer, and proposed inference items, and it does not contain a question per missing-link fact.
