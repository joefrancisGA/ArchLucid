> **Reviewed:** 2026-07-25

> **Scope:** Repeatable sales/CS demo — same architecture review, different policy-pack enforcement, different pre-finalize gate outcome. Uses shipped V1 governance dry-run and simulation endpoints only. Includes the policy-to-decision proof pilot run-sheet (assessment Tier 1 #1).
>
> **Audience:** Sales engineers and CS (Admin / architect workspace). Not a buyer self-serve help topic — buyers should use in-app [Governance approval](/help/governance-approval) and [Understanding governance alerts](/help/alerts) instead of running this script alone.

# Policy-pack delta demo script

**Audience:** Sales engineers, CS, and founders answering *"Why not another ChatGPT seat?"* (Admin / architect workspace)

**Last reviewed:** 2026-07-25

**Buyer outcome:** Prospects see that **policy assignments change finalize-gate outcomes** on the **same finalized architecture package** — not just different finding prose.

**Grounding rule:** Dry-run and simulation output is **architecture-review governance evidence**, not certification. See [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) and [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).

**Automation:** [`scripts/demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1) runs Phases B–D against a local or staging API when `-RunId` is supplied.

**Pilot sequencing:** [`#policy-to-decision-proof-pilot-run-sheet`](#policy-to-decision-proof-pilot-run-sheet) turns this demo + fixture + proof packet into one repeatable pilot.

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
3. Open the finalized review (`/reviews/{runId}`) — note findings severities present in the snapshot.

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

### Option B3 — Pre-finalize synthetic simulation (injects findings; API: pre-commit)

When the live snapshot is thin, inject synthetic severities without changing SQL findings:

```http
POST /v1/governance/pre-finalize/simulate
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

Then enable enforcement via architect workspace or tenant SQL — assignments ship with `BlockCommitOnCritical` default **false** until explicitly set.

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
| `GovernancePreCommitSimulationEvaluated` | After `POST /v1/governance/pre-finalize/simulate` |
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

## Policy-to-decision proof pilot (run-sheet)

**Implements:** assessment **Tier 1 #1 — Policy-to-decision proof pilot** ([`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §17).

This section sequences the shipped demo (above), deterministic fixture, and proof-packet assembly into one repeatable pilot. It does not restate policy logic, gate math, or ROI claims.

### What is human vs. automated

| Half | Who | What |
| --- | --- | --- |
| **Mechanism (automated)** | Coding agent / CI | The A/B delta is shipped: dry-run + pre-finalize simulation endpoints, the demo script, and a deterministic regression fixture. Provable offline with **no live env and no buyer data**. |
| **Live demo (architect)** | Founder / SE | Run the A/B against a **finalized review** on a local or staging stack and narrate the gate flip. |
| **Authorized pilot + judgment (market-execution)** | Human + buyer | Run it on **authorized** evidence, capture the six deltas, and have a buyer judge that the changed decision matters. A coding agent cannot perform this. |

### Step 0 — Offline / CI rehearsal

Prove the mechanism still holds before booking any live session.

- **Canonical fixture:** [`../../tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json`](../../tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json)
- **Backend regression:** `ArchLucid.Application.Tests/Governance/PolicyAbDemoRegressionTests.cs`
- **UI regression:** `archlucid-ui/src/lib/policy/policy-ab-demo-fixture.test.tsx`

```powershell
dotnet test .\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PolicyAbDemoRegressionTests"
```

```powershell
cd archlucid-ui
npx vitest run src/lib/policy/policy-ab-demo-fixture.test.tsx
```

### Step 1 — Live A/B on one committed run

Drive Phases A–E above (or `.\scripts\demo-policy-pack-delta.ps1 -RunId <committed-run-id> -OutputDirectory artifacts/policy-pack-delta-demo`).

### Step 2 — Record the six decision deltas

For the **same run id**, record (redacted — no customer-identifying content):

| # | Delta | Source |
| --- | --- | --- |
| 1 | Changed **rule keys** (added/removed) | dry-run rule selection / before-after diff |
| 2 | **Finding set** change under enforcement | finalized review findings + dry-run |
| 3 | **Gate outcome** flip (`Blocked` false → true) | `GateResult.Blocked` in dry-run / pre-commit simulation |
| 4 | **Executive summary** delta | `GET /v1/roi/executive-summary` before/after posture |
| 5 | **Remediation owner** for the new blocking finding | one ITSM ticket correlation |
| 6 | **Audit timeline** of the dry-run/simulation events | `GET /v1/audit/export/csv` (Phase D) |

### Step 3 — Package buyer-safe + rehearse

- **Assembly + mock procurement review:** [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md#executive-paid-pilot-proof-packet-assembly--mock-procurement-review)
- **One-page buyer evidence:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map)

### Step 4 — Market-execution half

Running the pilot on **authorized** evidence and getting a buyer judgment is the human half. File the outcome in the paid-pilot ledger and track on [`GTM_BACKLOG.md`](GTM_BACKLOG.md); do not treat a green Step 0 rehearsal as buyer validation.

### Pilot acceptance checklist

- [ ] Step 0 regression tests pass (mechanism intact).
- [ ] Same **run id** shows a different gate outcome between default and stricter packs.
- [ ] All six deltas recorded, redacted.
- [ ] Packet assembled and survives the mock procurement review before any real send.
- [ ] Narrator states output is **review evidence**, not certification.

---

## Related

- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) — generic-AI comparison rubric + model-seats message test
- [`DEFAULT_POLICY_PACKS_V1.md`](DEFAULT_POLICY_PACKS_V1.md) — bundled platform packs
- [`AI_GOVERNANCE_REVIEW.md`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) — regulated vertical walkthrough
- [`../library/POLICY_PACK_DRY_RUN_INDEX.md`](../library/POLICY_PACK_DRY_RUN_INDEX.md) — vertical pack templates for the stricter arm
