# SN-QQ-06 — Asserting answers expire. Ignore does not change the diagram.

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-01 and SN-QQ-02. Do not rebuild the drawer.

## Goal

An answer that asserts a fact becomes an expiring `HumanAssertion`. An ignore only suppresses the question. A changed fingerprint opens the question again.

## Why

SA-18 requires an expiration on human assertions. A resource id can be reused after delete and recreate. A stored "don't ask again" must not outlive the evidence it was about, and it must not paint a declared edge or change path ranking.

## Read first

- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (HumanAssertion, required expiration)
- `ArchLucid.Application/InfraEvidence/SecurityDeclaredConnections/SecurityDeclaredConnectionSnapshotMerger.cs`
- `ArchLucid.Core/InfraEvidence/SecurityAssetAssertionConstants.cs`
- The SN-QQ-01 disposition record and the SN-QQ-02 fingerprint

## What to build

On the question list, compare the compiler's current fingerprint with the fingerprint stored on an `Answered` or `Ignored` row.

- Same fingerprint, and `ExpirationUtc` still in the future: keep the stored status. The row is not in the open count.
- Different fingerprint: set the row back to `Open`, append an audit entry `EvidenceChanged`, and include it in the open count. Do this for a reused resource id whose problem text or cited endpoints changed.
- `ExpirationUtc` in the past: set the row back to `Open` and append `Expired`.

Answer effects, written only for `Answered` rows whose answer code asserts a fact:

| Answer code | Effect |
| --- | --- |
| `Keep` | Expiring `HumanAssertion` that the resource is still required. Reason is the answer text. No invented edge. |
| `NamePeer` | Expiring declared connection through the existing declared-connection service, provenance `HumanAssertion`, expiration copied from the disposition. |
| `StandsAlone` | Expiring `HumanAssertion` that no connection is expected. It does not mark the node Connected. |
| `Retire`, `NotASessionHost`, `Register` | Store the answer on the disposition. Do not create an ARM change and do not create an observed fact. `Register` and `Retire` do not clear the yellow card in this session. |
| `NotSure` | No disposition write. |

`Ignored` writes the disposition only. It does not call the declared-connection service, does not change `ProvenanceKind` on any edge, and does not change path ranking or risk.

Inference Yes and No stay on `OperatorInferredConnectionService`. Do not write a second assertion for those rows. An ignore of an inference question is a SN-QQ-01 row with source `InferredConnection`, and the list hides that proposal while the ignore is unexpired and the fingerprint matches. Confirm is unchanged.

Never set `ProvenanceKind.ObservedFact` from this path.

## Tests

1. `Keep` creates a `HumanAssertion` whose expiration matches the disposition and creates no `ObservedFact`.
2. `Ignored` creates no declared connection and leaves diagram provenance unchanged.
3. A later snapshot with the same fingerprint keeps the ignore out of the open count.
4. A later snapshot whose problem text changed returns the question to `Open` and records `EvidenceChanged`.
5. A disposition whose `ExpirationUtc` is in the past is open again.
6. `NamePeer` uses the declared-connection merger's `HumanAssertion` provenance.
7. Inference confirm still creates one assertion, not two.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new assertion tests and the declared-connection merger tests you touch.
- Do not commit.
- Do not write to customer Azure.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A fact the reader asserts expires as `HumanAssertion`, an ignore drops out of the open count only while the evidence fingerprint matches, and a changed or expired fingerprint asks again.
