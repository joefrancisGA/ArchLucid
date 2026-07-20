> **Scope:** Buyer — evidence-linked differentiation against generic AI architecture review tools.

# Evidence-linked differentiation packet

**Last reviewed:** 2026-06-07

ArchLucid differentiates on **governed, provenance-backed architecture review** — not generic chat automation.

## Comparison matrix (buyer-safe)

| Capability | ArchLucid (evidence) | Generic AI review narrative |
| --- | --- | --- |
| Committed-run provenance | `provenance-references.json`, audit ids in sponsor packet | Often ad hoc screenshots |
| ROI scope labels | Server-authoritative disposition-aware savings | Unlabeled estimates |
| Claim boundary | `CLAIM_READINESS_STATUS.md`, real-mode evidence gate | Implicit or overstated |
| Retrieval grounding | Committed-run `retrieval-grounding.json` traces | Opaque citations |
| Release evidence | `release-evidence-bundle-manifest.json` profiles | Manual checklists |
| Tenant isolation | Database-per-tenant catalogs + classification matrix + architecture tests | Varies / not evidenced |

## Evidence links (do not overclaim)

- Sponsor packet: `archlucid sponsor-packet <runId>`
- Release bundle: `scripts/Emit-ReleaseReadinessEvidence.ps1`
- Trust center: [`trust-center.md`](trust-center.md)
- Claim readiness: [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md)

## What we do not claim

- Live Azure OpenAI quality without current `real-llm-evidence-gate.json`
- SOC 2 CPA attestation (roadmap posture only)
- Marketplace listing or customer references unless explicitly attached
