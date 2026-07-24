> **Scope:** Sequencing map — turn the shipped policy-pack delta mechanism into one repeatable **policy-to-decision proof pilot**: same finalized review, default pack vs stricter pack, recorded decision deltas, packaged buyer-safe. This is an **index/runbook only**; it restates no policy logic, gate math, or ROI claim — canonical sources own those. Dry-run/simulation output is **architecture-review governance evidence, not certification**. Running it on **authorized buyer evidence** with a human reviewer is the market-execution half (GTM backlog).

# Policy-to-decision proof pilot (run-sheet)

**Audience:** Founder / pilot operator / sales engineer answering the central moat question: *does changing the policy actually change the decision?*

**Goal:** On **one** committed architecture review, show that a default pack and a stricter/customer-like pack produce **different selected compliance rule keys, different finding enforcement, a flipped pre-commit gate, and a different package narrative** — then package the result as a buyer-safe proof.

**Implements:** assessment **Tier 1 #1 — Policy-to-decision proof pilot** ([`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §17).

This run-sheet **reuses** the shipped demo script, automation, deterministic fixture, and proof-packet assembly. It does not duplicate them — every step links to the canonical owner.

---

## What is human vs. automated

| Half | Who | What |
| --- | --- | --- |
| **Mechanism (automated)** | Coding agent / CI | The A/B delta is shipped: dry-run + pre-commit simulation endpoints, the demo script, and a deterministic regression fixture (below). Provable offline with **no live env and no buyer data**. |
| **Live demo (operator)** | Founder / SE | Run the A/B against a **committed run** on a local or staging stack and narrate the gate flip. |
| **Authorized pilot + judgment (market-execution)** | Human + buyer | Run it on **authorized** evidence, capture the six deltas, and have a buyer judge that the changed decision matters. A coding agent cannot perform this. |

---

## Step 0 — Offline / CI rehearsal (no environment, no buyer data)

Prove the mechanism still holds before booking any live session. The deterministic fixture and regression tests fail if a stricter pack stops adding a rule key or stops flipping the gate.

- **Canonical fixture (source of truth):** [`../../tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json`](../../tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json) — synthetic, internal demo validation only.
- **Backend regression:** `ArchLucid.Application.Tests/Governance/PolicyAbDemoRegressionTests.cs` (mirrors the fixture in `PolicyAbDemoFixture.cs`):
  - stricter pack selects **one additional** compliance rule key;
  - same committed findings → pre-commit gate flips **allow → block**.
- **UI regression:** `archlucid-ui/src/lib/policy-ab-demo-fixture.test.tsx` — before/after rule-key delta renders the added key and the gate posture flips.

```powershell
dotnet test .\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PolicyAbDemoRegressionTests"
```

```powershell
cd archlucid-ui
npx vitest run src/lib/policy-ab-demo-fixture.test.tsx
```

If either fails, the demo narrative is at risk — fix before booking a live session.

---

## Step 1 — Live A/B on one committed run (operator)

Drive the shipped 5-minute narrative and capture artifacts.

- **Narrative + API/UI steps:** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](POLICY_PACK_DELTA_DEMO_SCRIPT.md) (Phase A baseline → Phase B stricter → Phase C pack-scoped delta → Phase D audit slice).
- **Automation (Phases B–D):** [`../../scripts/demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1).

```powershell
.\scripts\demo-policy-pack-delta.ps1 -RunId <committed-run-id> -OutputDirectory artifacts/policy-pack-delta-demo
```

Outputs: baseline dry-run, strict dry-run, pre-commit simulation, and audit CSV slice JSON under a timestamped folder.

---

## Step 2 — Record the six decision deltas

For the **same run id**, record (redacted — no customer-identifying content):

| # | Delta | Source |
| --- | --- | --- |
| 1 | Changed **rule keys** (added/removed) | `policy-pack-compliance-rule-key-diff` view / dry-run rule selection |
| 2 | **Finding set** change under enforcement | finalized review findings + dry-run |
| 3 | **Gate outcome** flip (`Blocked` false → true) | `GateResult.Blocked` in dry-run / pre-commit simulation |
| 4 | **Executive summary** delta | `GET /v1/roi/executive-summary` before/after posture |
| 5 | **Remediation owner** for the new blocking finding | one ITSM ticket correlation (see Step 3) |
| 6 | **Audit timeline** of the dry-run/simulation events | `GET /v1/audit/export/csv` (Phase D) |

Claim boundary: outputs are **review governance evidence**, not SOC/HIPAA/AI-Act certification ([`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)).

---

## Step 3 — Package buyer-safe + rehearse

Assemble the deltas into the executive proof packet and pressure-test before sending.

- **Assembly + mock procurement review:** [`EXECUTIVE_PAID_PILOT_PROOF_PACKET.md`](EXECUTIVE_PAID_PILOT_PROOF_PACKET.md) — the six required elements (including the **one remediation ticket** via ITSM correlation) and the pre-send gates.
- **One-page buyer evidence:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map).

---

## Step 4 — Market-execution half (route to GTM)

Running the pilot on **authorized** evidence and getting a buyer to judge that the changed decision matters is the human half. File the outcome in the paid-pilot ledger and track execution on the GTM backlog ([`GTM_BACKLOG.md`](GTM_BACKLOG.md)); do not treat a green Step 0 rehearsal as buyer validation.

---

## Acceptance checklist

- [ ] Step 0 regression tests pass (mechanism intact).
- [ ] Same **run id** shows a different gate outcome between default and stricter packs.
- [ ] All six deltas recorded, redacted.
- [ ] Packet assembled and survives the mock procurement review before any real send.
- [ ] Narrator states output is **review evidence**, not certification.

---

## Related

- [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](POLICY_PACK_DELTA_DEMO_SCRIPT.md) — 5-minute demo narrative + automation
- [`EXECUTIVE_PAID_PILOT_PROOF_PACKET.md`](EXECUTIVE_PAID_PILOT_PROOF_PACKET.md) — six-element assembly + mock review
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) — generic-AI comparison rubric
- [`../library/POLICY_PACK_DRY_RUN_INDEX.md`](../library/POLICY_PACK_DRY_RUN_INDEX.md) — vertical pack templates for the stricter arm
