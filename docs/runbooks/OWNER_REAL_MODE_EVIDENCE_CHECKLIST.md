> **Scope:** Owner-only operational checklist to close **T2-6** (real-mode quad-agent evidence) and unblock Phase B faithfulness baseline soak. No code changes required — repository variables, one local script run, optional CI variable enablement.

# Owner checklist — real-mode LLM evidence (T2-6)

**Audience:** repository owner / release operator with access to Azure OpenAI credentials and GitHub repo settings.

**Outcome:** A fresh `artifacts/release/real-llm-evidence-gate.json` (schema `archlucid.real-llm-evidence-gate.v2`, `overallOutcome: PASS`, `executionMode: real`, all four agent paths) that release evidence scripts can consume.

## Prerequisites (already resolved in repo)

- Azure OpenAI endpoint/key secrets exist in the GitHub repository (per owner decision 2026-06-06).
- Golden-cohort monthly cap is **$15** (`tests/golden-cohort/budget.config.json`).
- Budget probe uses **warn-on-skip** (kill-switch exit 2/3 does not fail unrelated merges).

## Checklist

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Set repository variable **`ARCHLUCID_CI_REAL_AOAI_ENABLED=true`** (Settings → Secrets and variables → Actions → Variables). | `dotnet-azure-openai-live-post-regression` job is eligible on push/workflow_dispatch (fork PRs still skip). |
| 2 | (Local) Copy **`secrets/local-real-aoai.env.example`** → **`secrets/local-real-aoai.env`** (gitignored); fill classic `https://{resource}.openai.azure.com/` endpoint, key, deployment. | `Import-LocalRealAoaiEnv.ps1` loads without error. |
| 3 | Run **`.\scripts\Invoke-RealLlmEvidenceGate.ps1`** from repo root. | Script exits 0; writes **`artifacts/release/real-llm-evidence-gate.json`** with `generatedUtc` ≤ 30 days and four passing agent paths. |
| 4 | Commit or attach the gate JSON for release candidates (per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md)). | Release claim scripts accept artifact age and schema. |
| 5 | (Optional) Enable **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`** and require **`cohort-real-llm-gate`** after one green nightly under the $15 cap. | See [`GOLDEN_COHORT_REAL_LLM_GATE.md`](GOLDEN_COHORT_REAL_LLM_GATE.md). |
| 6 | After **≥ 5 consecutive green nightly runs**, promote **Phase B** LLM faithfulness from warn-only to enforce (p50 ≥ 0.65). | Baselines under `tests/golden-cohort/baselines/`; see assessment Owner Decision Addendum in [`LATEST_GPT55.md`](../assessments/LATEST_GPT55.md). |

## Claim wording classes (`claimWordingClass`)

Release owners must match buyer-facing copy to the machine-readable class in `real-mode-claim-gate.json`:

| Class | When | Allowed buyer copy |
| --- | --- | --- |
| `full-real-mode` | Fresh `real-llm-evidence-gate.json` PASS with quad-agent paths | Real Azure OpenAI execution on representative agents |
| `partial-real-mode` | Gate present but stale, incomplete, or commit SHA mismatch | Partial real-mode evidence — do not claim full quad-agent proof |
| `simulator-only` | `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1` or explicit simulator RC | Walkthrough / simulator — not customer AI evidence |
| `waiver-required` | Strict RC requires gate; none attached and no valid waiver | Do not send sponsor materials until gate or waiver is recorded |
| `waived-not-verified` | Valid waiver JSON attached while gate is missing or HOLD | Explicitly waived — not verified real-mode proof |

Simulator/live divergence must appear in `simulator-live-divergence-summary.json` and the RC evidence rollup before any full-real-mode claim.

## Budget skip is not a release failure

When the kill-switch skips a real-LLM step (MTD ≥ 95% of $15), CI emits **`::warning::`** and stays green. The release claim reverts to **WARN/partial/simulator-only** until the next successful run under budget.

## Related

- [`GOLDEN_COHORT_BUDGET.md`](GOLDEN_COHORT_BUDGET.md) — warn/kill thresholds
- [`BUILD.md`](../engineering/BUILD.md) — local live evidence path
- [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) — session record template
