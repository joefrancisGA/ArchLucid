> **Scope:** Repeatable sales/CS demo — same architecture review, different policy-pack enforcement, different pre-finalize gate outcome. Uses shipped V1 governance dry-run and simulation endpoints only.
>
> **Audience:** Sales engineers and CS (Admin / operator shell). Not a buyer self-serve help topic — buyers should use in-app [Governance approval](/help/governance-approval) and [Understanding governance alerts](/help/alerts) instead of running this script alone.

# Policy-pack delta demo script

**Audience:** Sales engineers, CS, and founders answering *"Why not another ChatGPT seat?"* (Admin / operator shell)

**Buyer outcome:** Prospects see that **policy assignments change finalize-gate outcomes** on the **same finalized architecture package** — not just different finding prose.

**Grounding rule:** Dry-run and simulation output is **architecture-review governance evidence**, not certification. See [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) and [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md).

**Automation:** [`scripts/demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1) runs Phases B–D against a local or staging API when `-RunId` is supplied.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Committed run** | A run with a findings snapshot (demo Workspace A/B or pilot `-RunId`). Example local pilot run: `eb81dd4972ad429e8d4e214f9934bfc0`. |
| **ReadAuthority** | Dry-run and pre-commit simulation routes. |
| **PolicyPackMutationAuthority** | Only if you **persist** assignment changes (Phase C optional persist path). |
| **RequireAuditor** (or dev bypass) | Audit CSV export (`GET /v1/audit/export/csv`). |
| **Scope headers** | Match tenant/workspace/project for the run ([`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md)). |

Enable **`ArchLucid:Governance:PreCommitGateEnabled=true`** on the host when demonstrating a **real** blocked commit (409). Phases A–B work with dry-run/simulation even when the gate is disabled globally.

---

## Narrative arc (5 minutes)

1. **Same review, default posture** — bundled packs at **P0 priority floor**; pre-commit enforcement off or Critical-only.
2. **Tighten enforcement** — enable **Block commit on critical** or lower **`BlockCommitMinimumSeverity`** to Warning (1).
3. **Dry-run the delta** — governance API shows **would block** without mutating the run.
4. **Audit proof** — export CSV slice with `GovernancePreCommitSimulationEvaluated`, `GovernanceDryRunRequested`, or (on real commit attempt) `GovernancePreCommitBlocked` / `GovernancePreCommitWarned`.

---

## Phase A — Baseline: default P0 floor (allow path)

### UI

1. Open **Policy packs** (`/policy-packs`) — note **Bundled default (platform)** rows (**AI Governance / Responsible AI**, **Security Architecture Baseline**).
2. Open **Governance resolution** (`/governance-resolution`) — confirm merged **`priorityFloor: P0`** in effective advisory defaults.
3. Open the committed review (`/reviews/{runId}`) — note findings severities present in the snapshot.

### API

```http
GET /v1/policy-packs/effective
Authorization: Bearer {token}
X-Tenant-Id: {tenantId}
X-Workspace-Id: {workspaceId}
X-Project-Id: {projectId}
```

**Talk track:** *"At P0 floor we enforce the must-have rule subset first — this is how pilots start without blocking on every advisory."*

---

## Phase B — Stricter enforcement (block path, no persist)

Use **read-only** governance dry-run with enforcement overrides. No pack content or gate logic changes.

### Option B1 — Proposed pack content + Critical block (single run)

```http
POST /v1/governance/policy-packs/dry-run
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetRunId": "{runId}",
  "policyPackContentJson": "{ ... existing Security Baseline or AI Governance content ... }",
  "blockCommitOnCritical": true,
  "blockCommitMinimumSeverity": null
}
```

**Expected:** `gateResult.blocked: true` when the run snapshot contains **Critical** findings; `false` when only Warning/Error severities remain below threshold.

### Option B2 — Lower severity floor (Warning and above)

```http
POST /v1/governance/policy-packs/dry-run
Content-Type: application/json

{
  "targetRunId": "{runId}",
  "policyPackContentJson": "{ ... }",
  "blockCommitOnCritical": false,
  "blockCommitMinimumSeverity": 1
}
```

Severity enum: `Info=0`, `Warning=1`, `Error=2`, `Critical=3` ([`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md)).

### Option B3 — Pre-commit synthetic simulation (injects findings)

When the live snapshot is thin, inject synthetic severities without changing SQL findings:

```http
POST /v1/governance/pre-commit/simulate
Content-Type: application/json

{
  "runId": "{runId}",
  "syntheticSeverity": "Critical",
  "syntheticCount": 1
}
```

**Expected:** `blocked: true` when an enforcing assignment exists with `BlockCommitOnCritical` or minimum severity set; audit event **`GovernancePreCommitSimulationEvaluated`**.

**Talk track:** *"Same run id, different enforcement posture — the gate outcome flips. That is the moat: policy-aware workflow, not a better paragraph."*

---

## Phase C — Pack-scoped dry-run (optional, multi-run delta)

Resolve the **Security Architecture Baseline** pack id from the list endpoint, then dry-run proposed threshold overrides across run ids:

```http
GET /v1/policy-packs
Authorization: Bearer {token}
```

```http
POST /v1/governance/policy-packs/{policyPackId}/dry-run
Content-Type: application/json

{
  "proposedThresholds": {
    "priorityFloor": "P0"
  },
  "evaluateAgainstRunIds": ["{runId}"]
}
```

Repeat with `"priorityFloor": "P1"` (or assign a stricter vertical template from [`POLICY_PACK_DRY_RUN_INDEX.md`](../library/POLICY_PACK_DRY_RUN_INDEX.md)) and compare **`wouldBlockCommit`** per run in the response.

**Optional persist (operator only):** assign or update pack enforcement in UI (**Block commit on critical** in rule authoring / lifecycle) or:

```http
POST /v1/policy-packs/{policyPackId}/assign
Content-Type: application/json

{
  "version": "1.0.0",
  "scopeLevel": "Project",
  "isPinned": false
}
```

Then enable enforcement via operator UI or tenant SQL — assignments ship with `BlockCommitOnCritical` default **false** until explicitly set.

---

## Phase D — Audit CSV slice (sponsor evidence)

After Phase B3 (simulation) or a real blocked commit attempt:

```http
GET /v1/audit/export/csv?runId={runId}&maxRows=500
Accept: text/csv
Authorization: Bearer {token}
```

Filter in spreadsheet or re-query with event type:

```http
GET /v1/audit/export/csv?runId={runId}&eventType=GovernancePreCommitSimulationEvaluated&maxRows=100
```

**Look for:**

| Event type | When |
|------------|------|
| `GovernancePreCommitSimulationEvaluated` | After `POST /v1/governance/pre-commit/simulate` |
| `GovernanceDryRunRequested` | After governance policy-pack dry-run routes |
| `GovernancePreCommitBlocked` | Real commit blocked (409 `#governance-pre-commit-blocked`) |
| `GovernancePreCommitWarned` | Warn-only severities configured; commit proceeds |

See [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md).

---

## Local automation

From repo root (Development API @ `http://127.0.0.1:5128`, DevelopmentBypass or bearer token):

```powershell
.\scripts\demo-policy-pack-delta.ps1 `
  -BaseUrl http://127.0.0.1:5128 `
  -RunId eb81dd4972ad429e8d4e214f9934bfc0 `
  -OutputDirectory artifacts/policy-pack-delta-demo
```

Outputs: JSON artifacts for baseline dry-run, strict dry-run, pre-commit simulation, audit CSV slice metadata, **`policy-pack-before-after-diff.json`**, and **`policy-pack-before-after-diff.md`** under a timestamped folder.

**Canonical structured diff (CI):** `dotnet test ArchLucid.Application.Tests --filter FullyQualifiedName~PolicyPackBeforeAfterDiffDemoTests` produces a Verify snapshot of the full finding / rule-priority / executive-summary delta using the synthetic fixture (`tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json`).

---

## Phase E — Before/after diff artifact (bundle)

After Phases B1–B2, the automation script writes:

| File | Purpose |
|------|---------|
| `policy-pack-before-after-diff.json` | Machine-readable gate flip + pointers to dry-run JSON arms |
| `policy-pack-before-after-diff.md` | Talk-track summary for sponsors |

When you **persist** a stricter assignment (`POST /v1/policy-packs/{id}/assign`), re-export audit CSV and cite **`PolicyPackAssignmentCreated`** alongside **`GovernanceDryRunRequested`**.

---

## Acceptance checklist (CS / founder)

- [ ] Prospect sees **same run id** with **different gate outcome** after enforcement change or dry-run override.
- [ ] Demo cites **policy pack names** (Security Baseline / AI Governance), not model names.
- [ ] Audit CSV or UI audit search shows at least one governance pre-commit or dry-run event for the run.
- [ ] Narrator states output is **review evidence**, not SOC/HIPAA/AI Act certification.

---

## Related

- [`POLICY_TO_DECISION_PROOF_PILOT_RUNSHEET.md`](POLICY_TO_DECISION_PROOF_PILOT_RUNSHEET.md) — sequences this demo + deterministic fixture + proof-packet into a repeatable pilot (assessment Tier 1 #1)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) — generic-AI comparison rubric
- [`DEFAULT_POLICY_PACKS_V1.md`](DEFAULT_POLICY_PACKS_V1.md) — bundled platform packs
- [`AI_GOVERNANCE_REVIEW.md`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) — regulated vertical walkthrough
- [`MODEL_SEATS_COUNTER_POSITIONING_TEST.md`](MODEL_SEATS_COUNTER_POSITIONING_TEST.md) — objection handling
