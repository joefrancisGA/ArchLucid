> **Scope:** Engineering source of truth — Real-mode LLM variance cannot corrupt committed manifests (**TB-1196**). Distinct from PilotStrict floors (Done **TB-684**) and execution-mode labeling (**TB-969**–**TB-971**).

# Agent output → decisioning Real-variance isolation contract (TB-1196)

> **Audience:** Contributors, principal architects, and GTM reviewers stress-testing whether agent prose becomes the signed architecture package.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#agent-output-decisioning-real-variance-m-204`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#agent-output-decisioning-real-variance-m-204).  
> **Evaluation spine:** [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md) · ADR [0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) · ADR [0042](../architecture/adrs/0042-canonical-run-write-surface.md).  
> **Authority vs AgentTask:** **TB-1007** / **M-159**.  
> **PilotStrict vs Real:** **M-166** / **M-167**.  
> **GTM:** **M-203** / **M-204** · **Honesty CI:** **TB-1197** (shipped — `scripts/ci/check_unvalidated_proposal_overlay_honesty.py`; Vitest `archlucid-ui/src/lib/unvalidated-proposal-overlay-honesty.test.ts`).

---

## Decision in one line

**Decide from typed findings + sealed graph.** Agent free text and unvalidated `ProposedChanges` are **advisory** until schema **and** domain validation at commit (validate-before-overlay). Prose is quarantined to audit/telemetry. **PilotStrict green does not** make Real overlays corruption-proof. **INV-002** mode labels are required — they do not close overlay gates.

---

## Authoritative decide inputs

| Input | Role | Not authoritative |
| --- | --- | --- |
| Sealed `FindingsSnapshot` | Typed finding engines + payload validator | Free-form agent completion text |
| Sealed graph snapshot | Topology/cost/compliance structure at decide time | `ReasoningTrace` prose |
| `RuleBasedDecisionEngine` | Builds `ManifestDocument` → hash | Unvalidated proposal JSON |

**Code anchors:** `RuleBasedDecisionEngine`, `DecisionMergeInputGate` (schema-only today), `FindingsSnapshot` validators.

---

## Agent proposals (advisory until validated)

| Layer | Today | Target (**TB-1196** implementation follow-on) |
| --- | --- | --- |
| `ProposedChanges` / topology proposals | May merge via `AgentTopologyProposalGraphMerge` at commit | **Validate-before-overlay**: schema + domain invariants; reject/HOLD → no overlay, no new `GoldenManifestId` |
| `DecisionMergeInputGate` | Schema gate | Not domain/provenance closure alone |
| Finding `Message` / narrative | Display + audit | Never governance tags or topology nodes |

---

## Prose quarantine

| Surface | Allowed use | Forbidden use |
| --- | --- | --- |
| `ReasoningTrace` | Audit, operator explainability, telemetry | Topology nodes, compliance tags, manifest fields |
| Agent completion free text | Advisory UX, debug | Signed package content |
| Critic / insight prose | Post-process hints | Committed manifest truth |

---

## Fail-closed Real commit path

| Control | Role |
| --- | --- |
| PilotStrict + Enforce/Block | Commit-eligible Real runs (**M-166**) |
| Quality reject vs transport failure | **TB-963** triage |
| `StructuralExecutionMode` on every `AgentResult` + run | INV-002 — never promote Simulator→Real |
| Unit of buyer truth | Committed `GoldenManifestId` + `ManifestHash` (**TB-1003**) |

---

## Simulator vs Real variance

| Surface | Buyer-safe pin |
| --- | --- |
| Simulator fixtures | Stable; not Real proof |
| Real LLM outputs | Vary; same typed decide chokepoint **intent** |
| Quality Enforce/Block | May hold bad outputs — **not** substitute for validate-before-overlay |
| Mode labels | Disclose path; **≠** overlay gate closed |

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| “Agent free text / unvalidated ProposedChanges = signed package” | Typed findings + graph decide; proposals advisory |
| “PilotStrict green → Real overlays corruption-proof” | Overlay residual until validate-before-overlay ships |
| Omit commit topology overlay residual | Disclose `AgentTopologyProposalGraphMerge` path |
| “Mode label = safe to commit Real overlays” | Label ≠ overlay validation |

---

## Related backlog

| ID | Role |
| --- | --- |
| **TB-1196** | This contract |
| **TB-1197** | Honesty CI (shipped — `check_unvalidated_proposal_overlay_honesty.py`) |
| **TB-1221** | Structural provenance fail-closed |
| **TB-1230** | Shared hallucination defense plane (no mode fork) |
| **TB-1007** | Authority vs AgentTask loop |
| Done **TB-684** | PilotStrict floors (not reopened) |

## TB-1197 CI anchors (shipped)

| Anchor | Purpose |
| --- | --- |
| `scripts/ci/check_unvalidated_proposal_overlay_honesty.py` | Buyer-doc guard for prose-as-package / PilotStrict overlay overclaims |
| `archlucid-ui/src/lib/unvalidated-proposal-overlay-honesty.test.ts` | Vitest contract drift guard |
| `AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md` | Required citation for agent-merge / Real-variance claims |

**Implementation note:** This row is **docs-only**; validate-before-overlay code may ship as a separate TB after contract publication.
