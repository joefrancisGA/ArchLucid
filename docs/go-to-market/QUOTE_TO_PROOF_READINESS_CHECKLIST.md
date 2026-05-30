> **Scope:** Service-led quote-to-proof closeout checklist (founder / AE use).

> **Spine doc:** [`COMMERCIAL_DECISION_PACKET.md`](COMMERCIAL_DECISION_PACKET.md) · Proof CLI: `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId>`

# Quote-to-proof readiness checklist

Use this after a **committed** architecture review run. Each row is PASS / WARN / HOLD / DEFERRED_SCOPE. Deferred procurement items do **not** reduce product readiness language in `(A)` scoring.

## 1. Run and proof posture

| Check | PASS when | HOLD when |
| --- | --- | --- |
| Run committed | `run-evidence.json` shows committed manifest + status | Run still in progress or failed commit |
| Proof disposition | `quote-to-proof-readiness.json` → `proofDisposition: PASS` | `HOLD` or demo tenant warning |
| ROI source basis | `roiBasisStatus: classified` when dollar claims present | `hold_missing_sources` or absent catalog |
| Redaction manifest | `redaction-manifest.json` → `status: PASS` | `NOT_APPLIED` — do not external send |
| Execution mode labeled | `environment.json` names structural execution mode | Mode missing or ambiguous |
| Limitations reviewed | `limitations.md` read; skipped gates understood | Unknown skipped gates |

## 2. ROI and sponsor language

| Check | PASS when | HOLD when |
| --- | --- | --- |
| ROI basis classified | `roi-metric-sources.md` present with source rows | `roiBasisStatus: not_collected` |
| No unsupported savings | No headline $ claims without source row | Savings cited without basis |
| Governance summary | `governance-outcome-summary.json` reviewed | Governance blocking decision unclear |

## 3. Audit and traceability

| Check | PASS when | HOLD when |
| --- | --- | --- |
| Audit summary | `audit-evidence-summary.json` disposition PASS/WARN with counts | Zero audit rows and not truncated |
| Audit sample ids | `audit-sample.json` lists event ids only (no payloads) | Missing entirely |
| Scale envelope | `scale-envelope-evidence.json` reviewed — no SLA implied | Fabricated performance claims in narrative |

## 4. Commercial next action

| Field | Owner action |
| --- | --- |
| Recommended offer | Architecture Review Pilot (service-led or SaaS trial) |
| Tier fit | Team tier — see `PRICING_PHILOSOPHY.md` |
| Follow-up SLA | Log quote follow-up within **7 days** (`quote-to-proof-readiness.json`) |
| Next customer ask | PASS → schedule 30-minute sponsor review; HOLD → resolve limitations first |

## 5. Explicitly deferred (DEFERRED_SCOPE — do not promise)

- SOC 2 CPA attestation (TB-135 / V1.1 backlog)
- Third-party pen-test publication (planned, not yet scheduled)
- Live Marketplace / Stripe checkout (commerce un-hold)
- Public reference customer case study (#24)
- First-party ITSM/chat connectors (V1.1 backlog)

## Artifact folder (expected files)

After `pilot proof-packet <runId> --out <dir>`:

- `proof-summary.md`, `limitations.md`, `environment.json`
- `quote-to-proof-readiness.json`, `governance-outcome-summary.json`, `redaction-manifest.json`
- `audit-evidence-summary.json`, `audit-sample.json`, `scale-envelope-evidence.json`
- `run-evidence.json`, `roi-metric-sources.md` (when ROI rows exist)
