> **Scope:** Engineering contract for SecureNow automated security-architect engines over the infrastructure-evidence plane. **Contributor-reference** — internal only.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Observation plane:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Prompts:** [`../architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md)

# SecureNow architect plane

**Status:** Design contract for Composer prompts **SA-01–SA-22**. Not shipped product.

SecureNow is not a bigger vulnerability scanner. A scanner asks “what is misconfigured?” An automated security architect asks: what is dangerous, why, what can it reach, what depends on it, what should change, what could break, and how do we prove the change worked.

This plane **consumes** `AzureInventorySnapshot` and related IE artifacts. It does **not** add a second Azure collector, an apply engine, a CMDB, a SIEM, or a new `IFindingEngine` coverage family.

## 1. Spine (non-negotiable)

```text
Azure + optional adapters (Entra / CI federated identity)
        → Normalized evidence (AzureInventorySnapshot)     [IE plane]
              → Security evidence graph projection         [SA-02]
                    → Privilege-path engine
                    → Intended reachability engine
                    → Capability-to-flow engine
                    → Shared-control blast-radius engine
                    → Temporal / four-reality drift
                          → Path records (cite hops)
                                → OperationalSecurityFinding (cites PathId)
                                      → Ranking + cut points
                                            → Advisory remediation + verify on next snapshot
                                                  → Architecture-outcome metrics
```

**AI explains cited paths. AI is not the evidence.**

## 2. Hard invariants

| Invariant | Meaning |
|-----------|---------|
| **Observation before inference** | Engines read snapshot rows and labeled edges. They do not invent ARM topology. |
| **Epistemic categories stay distinct** | Every hop and relationship carries `ProvenanceKind`: ObservedFact, DerivedFact, DeterministicInference, AiInference, HumanAssertion. Never promote AiInference to ObservedFact. |
| **Paths are first-class; findings cite paths** | Engines emit `SecurityEvidencePath` records. `OperationalSecurityFinding` references `PathId`. Findings are **not** graph nodes that later engines traverse. |
| **Not `IFindingEngine`** | Architect engines write the **operational** finding stream. Do not grow sealed-review coverage engines or the insight-density denominator. [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md). |
| **Capability ≠ observed flow** | Control plane supports *possible* movement (capability-to-flow). Do not claim exfiltration or “data flowed” without HumanAssertion or data-plane evidence. Copy uses “may access / may reach.” |
| **Intended vs observed vs unverified reachability** | NSG/UDR/PE/public-IP composition is **intended** control-plane reachability. Flow logs are **observed** when present. Missing controls are **InsufficientEvidence**, not implicit allow. |
| **Ordinal confidence, no fake precision** | Bands: Confirmed, HighlyLikely, Probable, Possible, InsufficientEvidence. No “82%” unless a calibrated model exists (it does not). Path band = weakest hop. |
| **Independent ranking dimensions** | Exposure, privilege, blast radius, business consequence, confidence. Unknown consequence must **not** zero a real technical path. No single multiplicative magic score as the product of record. |
| **No customer Azure mutation** | Execute remains advisory (runbook / TF representation / ITSM). Verify on a **later** snapshot. Never `terraform apply`, ARM writes, or write roles. |
| **Collectors fail soft** | Missing GitHub, Entra, flow logs, or classification → InsufficientEvidence / completeness warning. Do not block Azure-spine engines. |
| **Graph is substrate, not the product** | Operators buy ranked work they can act on. Keep the findings queue. Paths are the inspect/explain surface. |
| **One Azure collector family** | Extend IE-02 files when a property is missing. No `Get-SecureNowAttackPathPackage.ps1`. |
| **Tenant isolation** | ADR 0037. Path rows carry `TenantId`. Isolation tests required. |

## 3. Name map

| Brief name | Land as | Do not collide with |
|------------|---------|---------------------|
| Attack path / evidence path | `SecurityEvidencePath` + hops | Sealed architecture `Finding`; graph node named `SecurityFinding` |
| Privilege path engine | Operational path runner, `PathKind=Privilege` | `IdentityBlastRadiusFindingEngine` (`IFindingEngine`, review graph) |
| Data-flow engine | `PathKind=CapabilityToFlow` | `DataFlowTrustBoundaryFindingEngine`; observed PHI movement |
| Network engine | `PathKind=IntendedReachability` | Data-plane traceroute / NSG flow-log product |
| Cut point | `SecurityEvidenceCutPoint` | Remediation pattern ExactMatch |
| Confidence | `PathConfidenceBand` enum | Insight-density numeric score; Critic confidence |
| Human classification | `SecurityAssetAssertion` (expiry required) | `OperationalSecurityException`; architecture `RiskExceptionRecord` |

## 4. Security evidence graph (projection, not a mega-graph)

Project **from snapshot tables** into typed nodes and edges. Do not ingest pods, findings, CMDB CIs, or every GitHub workflow as V1 nodes.

### V1 node families (Azure spine)

- Identity (user, service principal, managed identity) from snapshot identity rows
- Azure resource (`TopologyResource` / inventory resource)
- Role assignment
- Network control (NSG, route, private endpoint, public IP, NIC, subnet, VNet)
- Policy assignment
- Shared control (when identifiable: root policy, shared MI, central Key Vault)

### V1 edge families

Reuse `GraphEdgeTypes` when they fit (`CONTAINS`, `CONNECTS_TO`, `DEPENDS_ON`, `EXPOSES`, `PROTECTS`, `APPLIES_TO`). Add constants only when needed, for example:

- `HAS_ROLE` / `ASSIGNED_TO`
- `USES_IDENTITY` / `CAN_ASSUME`
- `FEDERATES_AS` (adapter; absent → no edge)
- `CAN_READ` / `CAN_WRITE` (DerivedFact from RBAC, never ObservedFact)
- `ROUTES_TO` (DeterministicInference from UDR/NSG composition)
- `PROTECTED_BY`

Every edge: `ProvenanceKind`, `InferenceSource`, `Weight` &lt; 1 for non-observed, `EvidenceReference` to snapshot row(s).

**Out of V1 graph:** per-pod inventory, Defender CVE payloads, findings-as-nodes, business-owner nodes invented by AI.

## 5. Path record

`SecurityEvidencePath`:

- `PathId`, `TenantId`, `SnapshotId`, `PathKind`
- Ordered hops (from, to, edge type, provenance, confidence band, evidence ref)
- `PathConfidenceBand` = minimum hop band
- Optional `CrownJewelRef` only when a `SecurityAssetAssertion` exists
- `ExplanationTemplate` slots: actor, identity, network, asset, weak controls, proposed cut, verify query
- Hash of canonical hop list for idempotent ingest (`SourceSystem=ArchLucid.SecureNowArchitect`, `SourceFindingId` = path hash)

Path kinds:

| Kind | Question | Must not claim |
|------|----------|----------------|
| Privilege | Who can ultimately cause what privileged action? | Direct Owner when the path is transitive |
| IntendedReachability | What control-plane network paths exist from exposure to asset? | Packets actually flowed |
| CapabilityToFlow | Where *may* sensitive information move given permissions + network + declared deps? | Exfiltration occurred |
| SharedControlBlastRadius | If this control/identity fails or is malicious, what fan-out? | Centralization is inherently safe |
| ToxicCombination | Which findings/edges compose a path to a crown jewel (or high-privilege asset)? | Equal priority for missing tags vs path members |
| FourRealityDrift | Declared / IaC / observed / historical disagree on a path-relevant control | Drift is “just a CIS miss” |

## 6. Confidence bands

| Band | When |
|------|------|
| **Confirmed** | Every hop ObservedFact or DerivedFact; no missing controls |
| **HighlyLikely** | DeterministicInference hops allowed; no AiInference; no unverified reachability |
| **Probable** | Includes HumanAssertion (e.g. PHI label) and deterministic hops |
| **Possible** | Includes AiInference **or** unverified network/egress |
| **InsufficientEvidence** | Required hop or control could not be evaluated |

UI and APIs show the band name and the weakest-hop reason. Do not display a percentage.

## 7. Ranking (not a magic score)

Persist a breakdown. GET must explain. Rule version string required (e.g. `SA09-rank-v1`).

Independent dimensions:

- Technical exposure (public / partner / private)
- Privilege depth (read vs write vs identity-admin vs transitive deploy)
- Blast radius (fan-out count of downstream resources / identities)
- Business consequence (`Unknown` allowed)
- Confidence band
- Optional exploitability when a source finding supplies it

**Ranking policy:** documented lexicographic or weighted sum. `Unknown` business consequence does not multiply the score by zero. Tenant-configurable weights allowed; LLM must not write the score rows.

Cut points (SA-10): nodes/edges whose removal collapses the most **ranked** paths, weighted by a coarse operational-cost class (identity federation change &gt; NSG rule &gt; private endpoint + DNS). Recommend high-leverage advisory remediations; do not auto-execute.

## 8. Remediation and verification

Reuse IE-10–IE-15. Path-aware narrative (SA-14) adds:

- Problem, why it matters, exposure, affected dependencies
- Preconditions, blast-radius warning, safe rollout (e.g. PE → DNS → canary → disable public)
- Verification queries against the **next** snapshot

Organizational fields (SA-15) are HumanAssertion or empty. Do not invent owners.

## 9. Metrics (architecture outcomes)

Headline metrics are **not** “findings closed”:

- Critical / high-confidence paths removed vs prior snapshot
- Privileged identities on production paths reduced
- Unrestricted egress on sensitive-capability paths reduced
- Crown-jewel (asserted) exposure reduced
- High-radius shared controls segmented
- Exceptions expired
- Remediation recurrence on the same `CloudResourceId` + control

Ticket/finding counts may appear as supporting ops metrics (IE-15), not the SecureNow architect headline.

## 10. Adapters (after Azure spine)

| Adapter | Rule |
|---------|------|
| Federated CI identity (GitHub / Azure DevOps OIDC) | Optional ZIP sibling or ingest; privilege-path consumes `FEDERATES_AS` when present |
| Entra directory | Least-privilege Graph, default off, no Global Reader; fail to InsufficientEvidence |
| Data classification / criticality | Human assertions with **required expiration** (SA-18) |

Do not wait on adapters to ship privilege-path and intended-reachability on Azure RBAC + network.

## 11. AI roles

**Allowed:** summarize a cited path; propose remediation narrative; map ambiguous labels; executive explanation; PossibleMatch only (existing IE-11 guard).

**Forbidden:** invent snapshot rows or edges; grant permissions; declare compliance; ExactMatch; execute destructive change; silent conversion of hypothesis to ObservedFact.

Pattern: deterministic evidence → graph projection → engines → AI interpretation → deterministic validation (next snapshot).

## 12. Out of scope

- Mega-graph of every lecture node type (pods, message topics, CSAM-irrelevant findings-as-nodes, full CMDB)
- Per-pod Kubernetes inventory as V1 nodes
- Customer `terraform apply` / ARM writes / write roles
- Near-real-time activity-log SIEM
- Numeric confidence percentages
- Multiplicative risk as product of record
- New coverage `IFindingEngine` / DX-77
- AWS/GCP attack-path engines in this set (Azure spine only; SecureNow cloud policy is Azure-first)
- GTM **M-90 / M-44 / M-91 / M-92**; SOC 2 CPA; third-party pen test
- Desktop review tab collapse

## 13. Security / scale / reliability / cost

| Concern | Approach |
|---------|----------|
| Security | Reader-only collection; no secret values; SoD on pattern approve; AI cannot authorize or apply |
| Scale | Paths over snapshot neighborhood; incremental invalidation on IE-06 diffs (SA-13); MaxNodes already on graphs |
| Reliability | Idempotent path ingest; weakest-link confidence; verification ≠ emit-200 |
| Cost | Deterministic engines first; LLM only on cited paths; no full-estate AI topology invention |

## Related

- [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md)
- [`FINDING_STREAM_PRODUCT_OF_RECORD.md`](FINDING_STREAM_PRODUCT_OF_RECORD.md) — third stream is operational; SA writes that stream
- [`REMEDIATION_INSTANCE_WORKFLOW.md`](REMEDIATION_INSTANCE_WORKFLOW.md)
- [`REMEDIATION_PRIORITIZATION_AND_WAVES.md`](REMEDIATION_PRIORITIZATION_AND_WAVES.md)
- [`KNOWLEDGE_GRAPH.md`](KNOWLEDGE_GRAPH.md)
- [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
