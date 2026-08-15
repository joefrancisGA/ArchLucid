> **Scope:** Contributor-reference — comparison/replay minimal immutable snapshot set (TB-1024); not a buyer-facing trust claim.

# Comparison/replay — minimal immutable snapshot contract

**Status:** Active (V1)  
**Backlog:** **TB-1024** (this contract) · **TB-1025** (honesty CI anchors — open until shipped)  
**Audience:** Principal architects, integrators, coding agents  
**Related:** [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md) Flow C · [API_CONTRACTS.md](./API_CONTRACTS.md) (comparison verify §) · [COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md](./COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**) · [APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md](./APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009**) · [EVIDENCE_IMMUTABILITY.md](./EVIDENCE_IMMUTABILITY.md) · [AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md](./AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md) (**TB-1499** / **M-274**) · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-174**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-175](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#comparison-replay-immutable-snapshot-m-175) · PA alias [COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_PA_ONE_PAGER.md](../go-to-market/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_PA_ONE_PAGER.md) · ADR [0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md)

---

## 1. Purpose

Name the **minimal immutable snapshot set** so buyer “architecture drifted / stable” claims are real, and which surfaces are **stored-delta replay** or **live UI illusion** rather than verify-backed drift.

**Services (shipped):** `ComparisonAuditService` / `ComparisonReplayService` (artifact · regenerate · verify); `EndToEndReplayComparisonService` / `ComparisonDriftAnalyzer` for end-to-end paths.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Artifact-mode replay proves architecture is unchanged.” | Rehydrates stored `PayloadJson` — not a live re-compare. |
| “Live mutable UI side-by-side equals verify.” | No 422 `#comparison-verification-failed` contract. |
| “Uncommitted / Ask / enrichments prove drift.” | Not committed-manifest unit of truth (**TB-1003**). |
| “Platform WORM on `ComparisonRecords`.” | App-layer persistence; customer WORM on exports is ADR 0040. |
| “Empty `ManifestDiff` means no change.” | Missing manifests / warnings can look like “stable” — treat as incomplete, not proof. |

---

## 3. Minimal immutable set

| Element | Role |
|---------|------|
| `ComparisonRecords` row + type + left/right run or export IDs | Durable comparison identity (`persist=true`) |
| `PayloadJson` | Serialized report / diff at compare time |
| Per-run committed golden manifest (`GoldenManifestId` + `ManifestHash`) on **both** sides | Unit of truth (**TB-1003**) |
| Insert-only `AgentResults` (not `AgentResultEnrichments`) | Sealed agent outputs for regenerate (**TB-1009**) |
| `RunExportRecords` when claim is export-diff | Export-backed left/right identity |
| Committed run evidence / findings / graph anchors | Required for **regenerate** resolution |

Without both committed manifests + a persisted comparison, do **not** sell buyer drift/stable language.

---

## 4. Replay modes

| Mode | Behavior | Buyer-safe pin |
|------|----------|----------------|
| **artifact** (often default) | Rehydrate `PayloadJson` and export as-is | **Stored delta replay** — not live stability proof |
| **regenerate** | Rebuild from source runs/exports, then export | Sources must still load; still not verify unless compared |
| **verify** | Regenerate and compare to stored payload | **422** + `#comparison-verification-failed` on mismatch — backs “drifted / stable” |

**Buyer rule:** both runs committed + comparison persisted + claim backed by **verify** (or explicitly labeled artifact-only as “replay of stored delta”). Explicit regenerate + hash check may also back a labeled claim — prefer **verify** for procurement language.

---

## 5. Not in minimal set / illusion risks

| Surface | Why it is not verify |
|---------|----------------------|
| Ask / RAG freshness | Eventual index; not sealed package compare |
| Sponsor summary / sponsor copy | Narrative overlay |
| `AgentResultEnrichments` | Mutable overlay (**TB-1009**) |
| Uncommitted / draft runs | Not unit of truth |
| Simulator / demo polish | Illustrative — label, do not call stable |
| Compliance-trend charts without verify/regenerate | Aggregate UX, not package verify |
| Live mutable UI side-by-side | Eyeball compare; no 422 drift contract |
| Missing manifests → empty `ManifestDiff` | Incomplete inputs ≠ “no change” |

---

## 6. CI anchors for **TB-1025** (shipped)

Mechanical gate: `scripts/ci/check_comparison_replay_drift_honesty.py` (wired in `scripts/ci/run_buyer_surface_strict_guards.py`).

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| Artifact-mode “no drift” = architecture stable | Require §4 artifact vs verify split |
| Live UI compare = verify | Require 422 verify contract + §5 |
| Uncommitted / Ask / enrichment as drift proof | Require §3 committed manifests + persisted comparison |
| “Compare proves sealed package” without both manifests | Require §3 both-sides rule |

Vitest: `archlucid-ui/src/lib/comparison-replay-drift-honesty.test.ts`.

---

## 7. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Drift claims must not launder mutable overlays as sealed proof. |
| **Scalability** | Artifact replay is cheap; verify costs regenerate — disclose mode. |
| **Reliability** | Persist `PayloadJson` so replay does not depend on live UI state. |
| **Cost** | Default artifact avoids forced regenerate; buyers pay verify cost when they need proof. |

---

## 8. One-line buyer answer

**A durable comparison needs a persisted `ComparisonRecord` with `PayloadJson` against committed manifests on both sides; “unchanged since last review” requires verify mode — artifact replay and live UI side-by-side are not drift proof.**
