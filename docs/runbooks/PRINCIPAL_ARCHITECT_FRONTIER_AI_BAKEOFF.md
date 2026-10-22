> **Scope:** End-to-end operator runbook — one architecture evidence set, five validation steps. Market validation only; not a product spec.

# Principal architect frontier-AI bakeoff

**Audience:** Founder / delivery lead, facilitator, external principal-architect reviewer.  
**Last reviewed:** 2026-06-17

**Purpose:** Run a **buyer-safe bakeoff** on one sanitized architecture packet: manual frontier AI, ArchLucid, blind comparison, decision-delta scoring, and a sponsor-safe summary. Do **not** claim ArchLucid is smarter than frontier AI.

**Assessment:** Implements improvement **#1** (Principal Architect Frontier-AI Bakeoff) — validation artifacts only.

---

## Prerequisites

| Item | Reference |
| --- | --- |
| Sanitized architecture packet | Same file set for both arms — no PII |
| ArchLucid tenant / pilot path | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) or demo-safe fixture |
| Comparison framing | [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md) |
| Evidence pack checklist | [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md) |
| Session folder template | [`fixtures/bakeoff/session-template/README.md`](../../fixtures/bakeoff/session-template/README.md) |

**Time box:** 90–120 minutes facilitator time (excluding async sponsor send).

---

## Session layout

Copy the template before starting:

```powershell
$label = "pilot-session-01"
Copy-Item -Recurse fixtures/bakeoff/session-template "artifacts/bakeoff/$label"
```

Expected tree under `artifacts/bakeoff/<label>/` (local; do not commit customer-identifying content):

| Path | Step |
| --- | --- |
| `packet/` | Shared sanitized architecture inputs |
| `manual/` | Frontier-AI prompt + findings list |
| `archlucid/` | Run metadata + sponsor export |
| `blind/` | Blind packet outputs (facilitator holds source key) |
| `decision-delta.md` | Post-bakeoff interview capture |
| `bakeoff-summary.json` / `.md` | Sponsor-safe rollup |

---

## Step 1 — Principal architect + frontier AI review

**Goal:** Baseline findings list on the same packet ArchLucid will use.

1. Copy the manual prompt from [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md) or [`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt).
2. Attach the **same** sanitized packet as Step 2.
3. Save:
   - `manual/manual-ai-prompt.txt` — final prompt used
   - `manual/manual-findings.md` — numbered findings (severity + rationale + packet citation); **not** a raw chat dump
4. Record wall-clock minutes in `session-notes.md` or label **unknown**.

**Anti-patterns:** Do not tune the prompt after seeing ArchLucid output. Do not invent infrastructure not in the packet.

---

## Step 2 — ArchLucid review

**Goal:** Committed review with labeled execution mode and sponsor-ready export.

1. Create → execute → finalize one architecture review on the same packet ([`FIRST_CREDIBLE_REVIEW_ONE_SITTING.md`](FIRST_CREDIBLE_REVIEW_ONE_SITTING.md)).
2. Export sponsor artifact (first-value Markdown or proof ZIP) into `archlucid/`.
3. Write `archlucid/packet-metadata.json`:

```json
{
  "runId": "<committed-run-guid>",
  "executionMode": "Real",
  "evidenceBasis": "buyer-provided",
  "sessionLabel": "<label>"
}
```

Use `Simulator` or `Mixed` when applicable — never present simulator as live customer proof externally.

4. Record ArchLucid wall-clock minutes or label **unknown**.

---

## Step 3 — Blind comparison of findings

**Goal:** Score insight quality without arm bias.

**Protocol:** [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation) (alias: [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation))

**Option A — Fixture demo (internal dry-run)**

```powershell
.\scripts\Run-BlindInsightValidation.ps1 `
  -SessionLabel $label `
  -Fixture fixtures/blind-validation/regulated-scenario `
  -OutputRoot artifacts/bakeoff `
  -NonInteractiveScore -FillRating 4 -FillClassification U -AutoSummarize
```

Copy outputs from `artifacts/bakeoff/<label>/` into the session `blind/` folder.

**Option B — Live pilot packet**

```powershell
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture artifacts/bakeoff/<label> `
  --output artifacts/bakeoff/<label>/blind `
  --session-id <label>
```

Provide ArchLucid findings export + `manual/manual-findings.md` in the fixture layout expected by the assembler (see blind-validation regulated-scenario structure).

**Facilitator rules**

- Share `reviewer-packet.md` and `scoring-sheet.json` only — **not** `source-key.json`.
- Reviewer scores novelty, correctness, actionability, surprise, decision impact (1–5).
- Unblind only after scoring completes.

---

## Step 4 — Decision-delta scoring

**Goal:** Document whether any finding **changed** approval, priority, scope, or sponsor action.

1. Complete [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) (decision-delta interview) within 7 days (same session if buyer is present).
2. Save to `decision-delta.md` using [`fixtures/bakeoff/session-template/decision-delta.template.md`](../../fixtures/bakeoff/session-template/decision-delta.template.md).
3. Apply PASS / WARN / FAIL from the interview doc:

| Outcome | Meaning |
| --- | --- |
| **PASS** | ≥1 decision change from an ArchLucid finding not in the manual AI pass |
| **WARN** | Confirmatory only — packaging/audit value still recorded |
| **FAIL** | Participant would not run review #2; reason recorded |

4. Cross-link `findingIds` to blind scoring sheet where possible.

Store buyer-identifying summaries under `docs/go-to-market/validation-runs/` (local; permissioned only).

---

## Step 5 — Sponsor-safe summary

**Goal:** One-page rollup safe for sponsor forward — no superiority claims.

**Generate machine summary**

```powershell
python scripts/ci/build_generic_ai_bakeoff_summary.py `
  --archlucid-packet-dir artifacts/bakeoff/<label>/archlucid `
  --manual-ai-findings artifacts/bakeoff/<label>/manual/manual-findings.md `
  --session-notes "See session-notes.md; timing honest." `
  --json-out artifacts/bakeoff/<label>/bakeoff-summary.json `
  --markdown-out artifacts/bakeoff/<label>/bakeoff-summary.md
```

Add `--archlucid-minutes` / `--manual-minutes` only when measured.

**Complete facilitator rollup**

1. Fill [`fixtures/bakeoff/session-template/sponsor-safe-summary.template.md`](../../fixtures/bakeoff/session-template/sponsor-safe-summary.template.md).
2. Confirm anti-claims checklist (no "smarter than GPT", no invented benchmarks, execution mode labeled).
3. Attach blind session `session-summary.json` metrics if produced.

**Forward criteria:** Sponsor may forward when execution mode, evidence basis, and decision-delta outcome are labeled and anti-claims pass.

---

## Rollup checklist

| # | Item | Location |
| --- | --- | --- |
| 1 | Same sanitized packet both arms | `packet/` |
| 2 | Manual prompt + findings saved | `manual/` |
| 3 | ArchLucid run id + execution mode | `archlucid/packet-metadata.json` |
| 4 | Blind packet scored; source key secured | `blind/` |
| 5 | Decision-delta PASS/WARN/FAIL | `decision-delta.md` |
| 6 | Generated + facilitator summary | `bakeoff-summary.*`, sponsor-safe template |
| 7 | Anti-claim review complete | Session notes |

---

## Related

- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md)
- [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-insight-validation`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-insight-validation) (alias: [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md))
- [`SPONSOR_PACKET.md`](SPONSOR_PACKET.md)
- [`REAL_MODE_EVIDENCE_COHORT.md`](REAL_MODE_EVIDENCE_COHORT.md)
