> **Scope:** Healthcare claims vertical pilot — assign `healthcare-claims-v3` policy pack, run review, pre-commit gate, and commit using shipped demo seed references.

# Healthcare claims policy pack — pilot walkthrough

**Audience:** Pilot champions running the Claims Intake sample in the operator shell or against a hosted trial tenant.

**Grounding rule:** Every step maps to **shipped V1** API/UI surfaces. **Jira**, **Microsoft Teams**, and other first-party ITSM/chat connectors are **V1.1** — not required for this walkthrough ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

**Buyer-job detail:** Target buyer, trigger event, expected first findings, sponsor artifact example, ROI/procurement proof points, and claim boundaries live in [`HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](../../go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md). Use that page for sponsor-facing framing; use this walkthrough for operator steps.

---

## Demo seed references

| Artifact | Id / route |
|----------|------------|
| Sample review run | `claims-intake-modernization` — `/reviews/claims-intake-modernization` |
| Policy pack (UI detail) | `demo-healthcare-claims-pack` — `/governance/policy-packs/demo-healthcare-claims-pack` |
| Rule set id (metadata) | `healthcare-claims-v3` (version **3.4.1** in static demo payloads) |
| Primary finding (PHI storyline) | `phi-minimization-risk` — `/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| Compare pair (optional, Operate) | `claims-intake-run-v1` vs `claims-intake-run-v2` — `/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2` |

Static operator/demo mode serves curated payloads from `archlucid-ui/src/lib/operator-static-demo.ts` and `showcase-static-demo.ts` when APIs are unavailable.

---

## Prerequisites

1. **Operator shell** access with **ReadAuthority** (review) and **ExecuteAuthority** (commit) for your tenant.
2. **Standard** tier (or trial) with governance features enabled per [`V1_SCOPE.md`](../V1_SCOPE.md).
3. For live API steps: bearer token or session auth configured (`Authorization: Bearer …` or Entra SSO).

---

## Step 1 — Open the healthcare claims policy pack

**UI**

1. Sign in to the operator shell.
2. Expand sidebar: **Show all features** → **Sidebar layout** → enable **Show governance, audit & admin controls** (advanced disclosure).
3. Open **Governance** → **Policy packs** (or navigate directly to `/governance/policy-packs/demo-healthcare-claims-pack` in demo mode).
4. Confirm pack label references **`healthcare-claims-v3`** and healthcare compliance themes (PHI minimization, intake boundary controls).

**API (optional verify)**

```http
GET /v1/policy-packs/demo-healthcare-claims-pack
Authorization: Bearer {token}
```

Expect pack metadata with `ruleSetId: healthcare-claims-v3` in content JSON (demo seed).

---

## Step 2 — Assign pack to project scope

**UI**

1. On the policy pack detail page, use **Assign to scope** (project or tenant per your governance model).
2. Pin version **3.4.1** (or latest published version in your tenant).
3. Enable **Block commit on critical** or set **Minimum blocking severity** if your pilot exercises the pre-commit gate ([`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md)).

**API**

```http
POST /v1/policy-packs/{policyPackId}/assign
Content-Type: application/json
Authorization: Bearer {token}

{
  "version": "3.4.1",
  "scopeLevel": "Project",
  "projectId": "default",
  "isPinned": true
}
```

---

## Step 3 — Open or create the Claims Intake review

**UI (demo path — fastest)**

1. Navigate to `/reviews/claims-intake-modernization` (or **Home** → **Review package** → select **Claims Intake Modernization**).
2. Confirm run status shows a committed or in-progress review with healthcare/PHI findings narrative.

**UI (net-new review)**

1. **Capture** → **New review** (`/reviews/new`) with healthcare intake scenario inputs, **or** use the home-panel **Try healthcare claims sample** shortcut when offered.
2. Execute the review pipeline and wait for findings + manifest draft.

**API**

```http
GET /v1/architecture/run/claims-intake-modernization
Authorization: Bearer {token}
```

---

## Step 4 — Pre-commit governance dry-run

Before commit, preview gate outcome against the assigned pack.

**UI**

1. On review detail, open **Governance** / **Pre-commit check** (or policy dry-run panel when present).
2. Review blocking vs warning findings; note PHI minimization finding alignment with pack rules.

**API**

```http
POST /v1/governance/policy-packs/dry-run
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetRunId": "claims-intake-modernization",
  "policyPackContentJson": "{ ... healthcare-claims-v3 content ... }",
  "blockCommitOnCritical": true
}
```

See [`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md) for severity threshold semantics.

> Dry-run output is **architecture-review governance evidence** for sponsor packets — not HIPAA or regulatory certification.

---

## Step 5 — Commit manifest (when gate passes)

**UI**

1. Resolve or disposition blocking findings (or confirm warn-only severities per tenant config).
2. Select **Commit manifest** on review detail.
3. After success, open **Review package** sections: manifest summary, artifacts, exports.

**API**

```http
POST /v1/architecture/run/claims-intake-modernization/commit
Authorization: Bearer {token}
```

On block: `409` with `#governance-pre-commit-blocked` and `blockingFindingIds` extension.

---

## Step 6 — Sponsor packet (exports)

1. Download **Run summary one-pager** or architecture review board export from review detail **Exports**.
2. Cross-check ROI basis labels on **Executive summary** (`/dashboard`) — pricing basis must read **Retail**, **EA-adjusted**, or **Uploaded actual/amortized** per tenant evidence ([`ROI_MODEL.md`](../../go-to-market/ROI_MODEL.md)).
3. CI golden fixture for packet composition: `ArchLucid.Application.Tests/Exports/ExecutiveReviewPacketGoldenFixtureTests.cs` (see [`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md)).

---

## Related docs

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — single V1 first-pilot path
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — four-step Core Pilot spine
- [`AZURE_SAAS_READINESS_REVIEW.md`](AZURE_SAAS_READINESS_REVIEW.md) · [`AI_GOVERNANCE_REVIEW.md`](AI_GOVERNANCE_REVIEW.md) — sibling accelerators
- [`docs/samples/policy-packs/README.md`](../../samples/policy-packs/README.md) — sample pack JSON shapes
- [`onboarding/EVALUATION_GUIDE.md`](../../onboarding/EVALUATION_GUIDE.md) — full evaluator depth
