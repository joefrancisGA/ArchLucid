# Review record integrity

ArchLucid's sealed review record is the committed golden manifest for a finalized architecture review. Integrity means the package hash, findings snapshot, and audit trail stay append-only after finalize — corrections add new rows; they do not rewrite history.

## What the record contains

- Finalized findings with provenance labels (`trustLabel` / `trustLabelReason` on each finding).
- Evidence references and policy-rule identifiers where applicable.
- Execution mode disclosure (Real, Mixed, Simulator, Fallback) on the run header.
- Typed audit events for finalize, export, and governance disposition actions.

## What integrity does not claim

- The record does not prove the reviewed architecture is sound in production.
- Ask-review answers and impact-preview simulations are advisory overlays — they are not substitutes for the committed package unless explicitly exported and labeled.
- Simulator or demo-derived runs remain labeled; they must not be cited as live-model sponsor proof.

## Operator expectations

1. Finalize only after reviewing findings with origin × grounding visible.
2. Treat uncited Ask output as advisory until grounded in linked evidence.
3. Route material impact-preview recommendations through governance before implementation.

## Related

- [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](../PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary)
- [Where findings come from](FINDINGS_OPERATOR_GUIDE.md#where-findings-come-from) (`FINDING_PROVENANCE.md` alias)
- [IMPACT_PREVIEW.md](IMPACT_PREVIEW.md)
