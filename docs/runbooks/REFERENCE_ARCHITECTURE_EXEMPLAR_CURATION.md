> **Scope:** Owner and engineering checklist for adding or changing reference-architecture exemplar JSON indexed by `ExemplarCorpusIndexer` (Topology style prior only).

# Reference architecture exemplar curation

Reference-architecture exemplars are **style priors** for the Topology agent. Their text is retrieved and appended to the Topology user prompt via `TopologyExemplarStylePriorFormatter`. They are **not** cited in findings, **not** in the golden manifest hash, and **not** buyer evidence.

## Required `ArchitectureRequest` fields

Each indexed JSON file under `templates/reference-architectures/` must be a valid `ArchitectureRequest` payload:

| Field | Guidance |
| --- | --- |
| `requestId` | Stable, unique, tenant-neutral (e.g. `REF-TPL-MICROSERVICES-001`). Never a customer or pilot name. |
| `systemName` | Short PascalCase or kebab identifier; no PII, no `@`, no real company names. |
| `description` | ≥ 1 sentence: workload shape, primary Azure/AWS/GCP services, and security posture. |
| `cloudProvider` | `Azure`, `AWS`, or `GCP` — must match constraint and capability vocabulary. |
| `constraints` | ≥ 2 concrete, testable constraints (networking, identity, data residency, DR, etc.). |
| `requiredCapabilities` | Services the topology should name; align with `cloudProvider`. |
| `assumptions` | Optional traffic/region/ops assumptions that bound the pattern. |

Files ending in `.request.json` are **draft request templates** and are excluded from indexing. Only owner-reviewed patterns belong in the README matrix.

## Constraint and diversity guidance

- Write constraints as **decisions**, not slogans ("Private endpoints for all PaaS data planes" not "secure by design").
- Prefer **topology diversity** across the library: avoid ten near-duplicate three-tier web variants. Target distinct domains (batch, DR, zero-trust, regulated finance, event-driven, Kubernetes baseline, multi-cloud where justified).
- Align `cloudProvider`, `constraints`, and `requiredCapabilities` — an AWS three-tier pattern must not list Azure-only services.
- Keep exemplar JSON **self-contained**; do not reference tenant-specific run IDs, manifest IDs, or live pilot names.

## Prohibited content

- Customer, prospect, or employee names; email addresses; account IDs; subscription IDs.
- Copy-paste from a buyer's live architecture review or committed manifest.
- Policy-pack rule text or compliance control IDs (use PolicyPack corpus instead).
- Claims that the exemplar was "validated in production" unless the file is explicitly labeled as a fictional pattern in `description`.

## Style-prior scope boundary

Exemplars influence **structural layout only** (tiers, integration style, security zones). They must not:

- Appear as evidence refs or citations in agent output.
- Change manifest hash or commit-time golden corpus (`RAG-V1.1-001`).
- Replace policy-pack or prior-manifest retrieval for compliance or tenant memory.

Operators can confirm exemplar use on run detail via **TB-663** (`topologyReferenceArchitectureExemplar*` on retrieval grounding summary).

## Reviewer sign-off checklist

Before merging a new or changed exemplar:

1. [ ] README matrix row added or updated (`templates/reference-architectures/README.md`).
2. [ ] `requestId` unique across the directory; `systemName` + `cloudProvider` fingerprint not duplicated.
3. [ ] No PII or customer-specific identifiers in any field.
4. [ ] Constraints are specific and consistent with `cloudProvider`.
5. [ ] Pattern adds diversity (not a fifth minor variant of an existing row without owner approval).
6. [ ] `python3 scripts/ci/assert_reference_architecture_exemplars.py` passes locally.
7. [ ] Owner or delegated reviewer initials + date in PR description (human gate — not stored in JSON).

## CI and indexing

- **Guard:** `scripts/ci/assert_reference_architecture_exemplars.py` (pre-corset guards) enforces README ↔ file parity and fingerprint uniqueness.
- **Indexer:** `ExemplarCorpusIndexer` on deploy; document IDs `exemplar-{requestId}`.
- **Regression:** `ReferenceArchitecture` IR golden cases (**TB-662**) gate retrieval of platform exemplars.

## Cross-references

- `templates/reference-architectures/README.md` — indexed pattern matrix (**TB-660**).
- `docs/go-to-market/AI_READINESS_POSTURE.md#deeper-rag-quality-program` — corpus quality program.
- `docs/runbooks/RETRIEVAL_GROUNDING_OPERATOR_GUIDE.md` — operator retrieval UI.
- `ArchLucid.Retrieval/Topology/TopologyExemplarStylePriorFormatter.cs` — prompt block contract.
