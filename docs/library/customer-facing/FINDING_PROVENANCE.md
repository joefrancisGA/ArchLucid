# Finding provenance — where findings come from

Every ArchLucid finding is labeled by **origin** so a reviewer signing off can answer: did a deterministic policy rule fire, or did a language model produce this? Deterministic-rule findings carry the rule's rationale. AI-generated findings carry evidence references and a **grounding** label (evidence-backed, estimated, ungrounded, or degraded). Simulated findings are labeled and must not be cited as live-model output.

## Two axes

| Axis | What it answers | Values reviewers see |
|------|-----------------|----------------------|
| **Origin** | Who produced the finding? | Deterministic rule · AI-generated · Simulated |
| **Grounding** | How well is the conclusion supported? | Evidence-backed · Estimated · Ungrounded · Degraded · Not applicable (for rule/simulator origins) |

Origin is the primary badge next to severity on finding rows. Grounding appears as secondary text on the same chip.

## What each origin means

- **Deterministic rule** — A policy pack rule evaluated the evidence and fired. The rationale comes from the rule definition, not from a model.
- **AI-generated** — A language model produced the finding. Always read the grounding label and linked evidence before defending the finding in a design authority meeting.
- **Simulated** — Produced by the deterministic simulator (not a live model). Structurally valid for demos and dry-runs; not real-model evidence.

## What this does not claim

Provenance labeling describes **how** a finding was produced and whether evidence is attached. It does **not** claim accuracy rates, production validation, or that AI-generated findings are independently verified. Reviewers remain accountable for disposition decisions.

## Related product surfaces

- Finding rows on the review decision summary show origin × grounding chips.
- The decision summary includes a quiet aggregate line (for example: `12 findings — 7 from deterministic rules, 5 AI-generated (4 evidence-backed)`).
- In-app Findings help: [Where findings come from](/help/findings#where-findings-come-from).

## Engineering note (not buyer vocabulary)

Server-side trust calibration uses a typed label set (`EvidenceBacked`, `Estimated`, `Heuristic`, `SimulatorDerived`, `RealModel`, `Degraded`, `MissingCitation`, `DeterministicFallback`). Operator UI maps those into the origin × grounding axes above; enum names are not buyer-facing copy.
