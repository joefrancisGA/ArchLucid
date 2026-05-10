> **Scope:** End-to-end operator instructions for the optional **real-LLM** golden-cohort nightly path: how to flip the gate from disabled to required, how to respond when the **kill-switch** trips, and how to read the cost-and-latency Workbook. Pair with [`GOLDEN_COHORT_BUDGET.md`](./GOLDEN_COHORT_BUDGET.md) for the budget mechanics.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Golden cohort real-LLM gate â€” operator runbook

## 1. What this gate does

[`golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml) includes:

| Job | Purpose |
|-----|---------|
| **`cohort-real-llm-preflight`** | When **`vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** is **`true`**, runs the budget probe / kill-switch (**[`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py)**), opens GitHub issues on WARN/KILL, then runs **`GoldenCohortRealLlmGateTests`** (fixture presence / structural checks). **No live Azure OpenAI invoke** happens inside this job. |
| **`cohort-real-llm-live`** | After **preflight** records budget exit **`0`** (under warn) **`1`** (warn band: still below kill), invokes live drift when (**a**) **`workflow_dispatch`** with **`run_live_invoke=true`**, or (**b**) **`schedule`** cron **`0 6 * * 0`** (Sunday 06:00 UTC) **and** repository variable **`ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED`** is **`true`**. Requires **`vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** and secret **`ARCHLUCID_GOLDEN_COHORT_API_HOST`** (mapped to **`ARCHLUCID_API_URL`**). Runs **`dotnet run … golden-cohort drift --strict-real --structural-only`**. Prefer protected environments for secrets — see §2. |

Both paths honor probe semantics (see section 3): exit **2** skips downstream cohort steps **including live** without failing the workflow.

The Q15 ($50/month) approval was **conditional on the kill-switch being shipped** ([`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) Q15). If the kill-switch is bypassed, real-LLM execution must revert to disabled until the kill-switch is restored.

**Pilot / release session record:** [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) — use for ad-hoc real-mode validations outside the nightly cohort.

## 2. Flip preflight from optional to required (branch protection)

After the dedicated Azure OpenAI deployment exists in the production subscription **and** the protected GitHub Environment has the secrets injected (both owner-only operational tasks per Q15), promotion is:

1. Ensure **`cohort-real-llm-preflight`** is **required** in the GitHub branch-protection rule for **`main`** (required status check name matches the job id).
2. Optionally tighten the workflow later by removing or narrowing the **`if:`** on **`cohort-real-llm-preflight`** once you intend the job to run unconditionally whenever **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** is true — coordinate that edit with owners (see stop-and-ask boundaries below).

**Do not** flip branch protection in the same PR that ships the deployment — separate the two so a single PR can be reverted.

**`cohort-real-llm-live`** (invoke against **`ARCHLUCID_GOLDEN_COHORT_API_HOST`**) ships with two entry points:

* **Manual (`workflow_dispatch`)** — workflow input **`run_live_invoke=true`**; still requires **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** and **`ARCHLUCID_GOLDEN_COHORT_API_HOST`** (and preflight budget exit **`0`** or **`1`** in the same run).
* **Weekly schedule** — **`golden-cohort-nightly.yml`** cron **`0 6 * * 0`** (Sunday 06:00 UTC). Requires **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** **and** repository variable **`ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED=true`**; leave that variable **`false`** (or unset) so scheduled unattended invokes cannot run unless the owner opted in.

The weekday schedule uses **`0 6 * * 1-6`** and Sunday uses **`0 6 * * 0`** so the same calendar minute does **not** start two duplicate workflow runs.

Keep secrets (**`ARCHLUCID_GOLDEN_COHORT_API_HOST`**, Azure OpenAI IDs/keys/federation used by preflight) in a protected environment once you enable unattended schedule.

**Runner-side Azure OpenAI env (`cohort-real-llm-live` drift step):** the workflow exports **`AZURE_OPENAI_API_KEY`** from repository **secret** **`AZURE_OPENAI_API_KEY`**, **`AZURE_OPENAI_ENDPOINT`** from repository **variable** **`AZURE_OPENAI_ENDPOINT`** (HTTPS project or resource URL), and **`AZURE_OPENAI_DEPLOYMENT_NAME`** as **`gpt-4o`** for parity with [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md). Do not commit keys; rotate any key that was pasted into chat or logs.

## 3. Probe exit-code semantics (the kill-switch)

| Exit code | MTD spend (default cap = $50) | Workflow behavior | Issue created? |
| --------- | ----------------------------- | ----------------- | -------------- |
| **0** | < **80%** of cap (< $40) | Cohort runs normally | No |
| **1** | â‰¥ **80%** and < **95%** ($40 â‰¤ MTD < $47.50) | Cohort **still runs** (yellow band); workflow summary shows WARN | **Yes** â€” title `Golden cohort kill-switch WARN â€” YYYY-MM-DD` |
| **2** | â‰¥ **95%** of cap (â‰¥ $47.50) | Cohort **SKIPPED** for the rest of the month; workflow does **not** count as failure | **Yes** â€” title `Golden cohort kill-switch KILL â€” SKIPPED â€” YYYY-MM-DD` |
| **3** | Probe failed (auth, RBAC, network) | Cohort skipped; workflow does **not** count as failure | No (probe was unable to attribute spend) |

Threshold ratios **0.80 / 0.95** are pinned by [`scripts/ci/assert_golden_cohort_kill_switch_present.py`](../../scripts/ci/assert_golden_cohort_kill_switch_present.py); a PR that weakens them is blocked at merge time.

## 4. Responding to a kill-switch trip

### When **WARN** (exit 1) fires

1. The auto-created issue carries the workflow run URL and the MTD/warn/kill USD numbers.
2. Open the **Workbook** (Â§ 5) and scan the daily token-count trend â€” if a single day spiked, look for runaway prompt loops in the most recent cohort scenario JSON deltas.
3. **Decision tree:**
   * **Spend trajectory < cap** by month-end â†’ no action; close the issue with a short comment ("expected drift, on-track for $X by EOM").
   * **Spend trajectory crosses cap** â†’ file an owner decision: temporarily raise `monthlyTokenBudgetUsd` (PR + rationale) or pause the gate by flipping `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` to `false`.

### When **KILL â€” SKIPPED** (exit 2) fires

1. The cohort is skipped for the **rest of the calendar month**. Each subsequent nightly run will re-emit the kill state and either reopen or append to the daily issue (deduped by date).
2. **Do nothing** until the next month resets MTD â€” that is the safe default and is exactly what the Q15-conditional rule is protecting.
3. If staying offline for the rest of the month is **not acceptable** (e.g., a release window depends on the cohort), the owner can:
   * Raise `monthlyTokenBudgetUsd` in `tests/golden-cohort/budget.config.json` (PR + rationale + security review). The CI guard does **not** restrict the cap value, only the warn/kill ratios â€” so a cap raise is allowed.
   * Or move the cohort to a fresh `Microsoft.CognitiveServices/accounts` account with its own MTD (rare; recommended only when the existing account is shared with non-cohort workloads).
4. **Do not** weaken `warnThresholdPercent` or `killSwitchThresholdPercent` to "buy room" â€” that is exactly what the CI guard refuses (Q15-conditional rule).

### When **probe failed** (exit 3) fires

1. Inspect the workflow log â€” the probe prints the reason on stderr (missing `ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID`, RBAC denial, Cost Management 5xx, etc.).
2. The cohort is skipped (safe default â€” without an MTD signal we cannot honor the kill-switch).
3. Fix the underlying cause (RBAC: ensure the federated identity has **Cost Management Reader** on the subscription) and rerun the workflow with `workflow_dispatch`.

## 5. Reading the Workbook

The cost-and-latency Workbook is provisioned by the Terraform module [`infra/modules/golden-cohort-cost-dashboard/`](../../infra/modules/golden-cohort-cost-dashboard/README.md) inside the existing App Insights resource group. From the Azure portal:

1. Open the Application Insights resource â†’ **Workbooks** â†’ **"ArchLucid â€” Golden cohort real-LLM cost & latency"**.
2. Tiles, in order:
   * **Header** â€” restates the cap, warn %, kill %, and links back to this runbook.
   * **Kill-switch banner** â€” `enabled (warn=80% / kill=95%)` when the CI guard is in place. Shows `BYPASSED` only if the variables in Terraform have been overridden (which the module's `validation { }` blocks at plan time).
   * **Month-to-date spend (USD)** â€” daily MTD trend from the probe's `customMetrics.golden_cohort_mtd_usd`.
   * **Per-scenario p50/p95/p99 latency** â€” bar chart from `customMetrics.golden_cohort_latency_p*_ms`, one bar per cohort scenario.
   * **Daily token-count trend** â€” line chart from `customMetrics.golden_cohort_token_count`, useful for catching prompt-bloat well before MTD spend reflects it.
   * **Footer** â€” explains exactly which CI script / file feeds each tile.
3. The Workbook is **read-only by default** (`isLocked: true`) â€” only the cohort-ops role on the subscription can edit. To modify the queries, fork the Workbook in the portal and propose the JSON change as a PR against `infra/modules/golden-cohort-cost-dashboard/workbook.tpl.json`.

## 6. Stop-and-ask boundaries (do **not** automate these)

These are explicitly listed in `docs/archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md` Prompt 11. They remain owner-only:

* **Provisioning the dedicated Azure OpenAI deployment** â€” Cognitive Services account, deployment name, model SKU, region quota.
* **Injecting the Azure OpenAI secret** into the protected GitHub Environment.
* **Removing the `if:` guard on `cohort-real-llm-preflight`** (optional → always scheduled when you intend unconditional probe runs). Coordinate with owners; unattended **`cohort-real-llm-live`** is opt-in (**`ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED`**) plus budget exit **`0`**/**`1`**. Documented in section 2.

## 7. Structural validation (real-LLM output)

When the optional [`../../ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs`](../../ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs) gate is used, automation checks **only JSON shape** for each `AgentResult` returned by the API (after execute). It does **not** compare claim text, finding messages, or category strings to a golden string â€” those remain covered by the locked manifest SHA and finding-category multiset in the standard drift path.

**What is checked**

- The payload is valid JSON and the root is an object.
- Required top-level **AgentResult** properties are present: `resultId`, `taskId`, `runId`, `agentType`, `claims`, `evidenceRefs`, `confidence`, `createdUtc`, `findings` (camelCase, matching [`ArchLucid.Contracts.Agents.AgentResult`](../../ArchLucid.Contracts/Agents/AgentResult.cs) serialization).
- `agentType` in JSON matches the expected agent (Topology / Cost / Compliance / Critic), including enum-as-number when the API emits an integer.
- `findings` is a **non-empty** array (the cohort is expected to surface at least one finding per result for the gate to be meaningful).
- Each element of `findings` has a `trace` object (ExplainabilityTrace) with the list-shaped fields `graphNodeIdsExamined`, `rulesApplied`, `decisionsTaken`, `alternativePathsConsidered`, and `notes` (each a JSON array; empty arrays are valid). `sourceAgentExecutionTraceId` is optional and may be null or omitted.
- **No** assertion is made on the *contents* of strings or arrays (only that required keys exist and lists are JSON arrays).

**Why this shape**

Real models can paraphrase text while still being â€œcorrectâ€ for product semantics; comparing raw strings is brittle. Structural checks catch systematic wiring failures (missing explainability, empty finding sets, wrong envelope) that would make MTD cost and the Workbook hard to trust without content-level flakiness.

**CLI entry points**

- `archlucid golden-cohort drift --strict-real` â€” when the shell is configured for a real-LLM API host (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM` and/or `ARCHLUCID_AGENT_EXECUTION_MODE` / `AgentExecution__Mode=Real`) and the run has not recorded simulator fallback, run SHA + category drift **and** per-result structural validation. Any structural failure yields exit code 4 and prints a **JSON** report to stdout.
- `archlucid golden-cohort drift --structural-only` â€” skips **SHA-256 and category** checks (same [manifest fingerprinting](../../ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs) code path is simply not used for comparison); only structural validation and API connectivity. Combine with `--strict-real` to enforce the real-LLM shell + no-fallback rules and structural checks together.

**Unit tests** live under [`../../ArchLucid.Core.Tests/GoldenCorpus/RealLlmOutputStructuralValidatorTests.cs`](../../ArchLucid.Core.Tests/GoldenCorpus/RealLlmOutputStructuralValidatorTests.cs) and use `[Trait("Suite", "Core")]`; they cover valid/invalid/edge cases for all four agent types.

> Note: the structural validator **implementation** is in `ArchLucid.Core` (so the CLI and tests can share it). The `*.Tests` project contains the tests only.

## 8. Interpreting structural failures

| Symptom in JSON / stderr | Likely cause | What to do |
| ------------------------ | ------------ | ---------- |
| `jsonSyntax` check failed | Truncated body, non-JSON error page, or gzip/stream handling issue | Re-run with `--json` on a failing HTTP client, verify `/v1/architecture/run/{runId}` returns JSON, confirm proxy is not returning HTML. |
| `topLevelKeys` or `findingsNonEmpty` | Omitted contract field or empty `findings` from the executor | Inspect coordinator/agent pipeline for the agent type; real-LLM path must still emit a full `AgentResult` contract. |
| `agentTypeMatch` | Mismatched or missing `agentType` on a result row | Check task/result mapping for the run; each result should match the taskâ€™s agent. |
| `findingTrace` / `traceLists` | Missing `trace` or a Explainability list field is not a JSON array | Ensure persistence/serialization of ExplainabilityTrace (see decisioning models) is wired for real execution. |
| `sourceAgentExecutionTraceId` with wrong type | Value is neither `null` nor a string | Fix serializer or model to emit a string or null. |
| `findingSeverity` check failed | Finding has a missing or blank `severity` string | Real model returned a hollow or truncated finding; inspect the raw `AgentResult` JSON and check the agent prompt for severity field instructions. |
| `findingContent` check failed | All content fields (`description`, `message`, `title`, `detail`) are absent or blank | Model produced a structurally valid but content-hollow finding; check token budget and prompt completeness for the agent type. |
| Exit 4 with `code: "realModeFellBackToSimulator"` | The API recorded a real-LLM attempt that fell back to the simulator | Fix Azure OpenAI reachability, quota, or deployment name; the strict gate refuses to treat output as "real-LLM validated" in that case. |
| `strict-real` refused before connect | Real-LLM env not set in the shell | Export `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` or set agent execution mode to `Real` for the CLI process, as documented above. |

**Example: truncated trace** (single finding with `graphNodeIdsExamined` as a string instead of an array) fails the `traceLists` check with a message pointing at the offending `findings[i].trace` path — fix the type in the result builder, not the text of graph node ids.

## 9. Related files

| File | Purpose |
| ---- | ------- |
| [`../../ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs`](../../ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs) | Structural JSON validation (no content matching) |
| [`../../ArchLucid.Core.Tests/GoldenCorpus/RealLlmOutputStructuralValidatorTests.cs`](../../ArchLucid.Core.Tests/GoldenCorpus/RealLlmOutputStructuralValidatorTests.cs) | Core suite tests for the validator |
| [`../../ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs`](../../ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs) | `archlucid golden-cohort drift` (SHA drift + optional `--strict-real` / `--structural-only`) |
| [`tests/golden-cohort/budget.config.json`](../../tests/golden-cohort/budget.config.json) | `monthlyTokenBudgetUsd`, `warnThresholdPercent: 80`, `killSwitchThresholdPercent: 95` |
| [`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py) | The MTD probe; emits exit codes 0/1/2/3 |
| [`scripts/ci/assert_golden_cohort_kill_switch_present.py`](../../scripts/ci/assert_golden_cohort_kill_switch_present.py) | Merge-blocking guard for the Q15-conditional rule |
| [`scripts/ci/test_golden_cohort_budget_probe.py`](../../scripts/ci/test_golden_cohort_budget_probe.py) | Probe threshold-parsing unit tests |
| [`scripts/ci/tests/test_assert_golden_cohort_kill_switch_present.py`](../../scripts/ci/tests/test_assert_golden_cohort_kill_switch_present.py) | CI guard self-test |
| [`infra/modules/golden-cohort-cost-dashboard/`](../../infra/modules/golden-cohort-cost-dashboard/README.md) | Terraform module for the Workbook |
| [`.github/workflows/golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml) | Nightly workflow with the gated job |
| [`docs/runbooks/GOLDEN_COHORT_BUDGET.md`](./GOLDEN_COHORT_BUDGET.md) | Budget config / Cost Management mechanics |

---

## 10. Release cohort green bar (product planning)

**Audience:** Release owners, pilot leads, and operators aligning **manual real-LLM sessions**, golden cohort automation, and buyer-facing evidence.

**Adopted:** 2026-05-09 — planning baseline. These tiers are **not** merge-blocking CI numeric gates unless you separately wire automation to enforce them; pair with [`GOLDEN_COHORT_BUDGET.md`](./GOLDEN_COHORT_BUDGET.md) and [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md).

**Canonical model baseline — resolved (operator, 2026-05-11):** **`gpt-4o`**. Anything described as canonical **golden-cohort release quality**, drift interpretation, or agent-output cohort **green-bar** narratives assumes this SKU (**not** **`gpt-4o-mini`** and not ad‑hoc reasoning‑only substitutions for headline baselines unless a separate exec decision reopens calibration).

Set **`AzureOpenAI:DeploymentName`** (secrets + **`appsettings`**) to whichever **deployment resource name Azure returns** — it must resolve to **`gpt-4o`**. (`tests/golden-cohort/budget.config.json` **`deploymentName`** mirrors the operator label Cost Management spreadsheets use — it carries **no** model semantics.)

On the committed **release cohort** scenario set, use these targets:

| Layer | Target | Notes |
|-------|--------|--------|
| **Structural** (AgentResult envelope / schema-valid per repo gates) | **100%** | Any miss treats the cohort as failed — regression or prompt/wiring defect. Aligns with §7 structural philosophy (shape must hold even when content paraphrases). |
| **Quality gate** (`outcome="rejected"`) | **0%** on canonical cohort | Any rejected scenario fails the cohort for release narrative purposes. |
| **Semantic score** (`archlucid_agent_output_semantic_score`) | **p10 ≥ 0.50**, **p50 ≥ 0.70** | Investigation thresholds consistent with histogram-based alerting in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md); if missed, investigate — tighten thresholds after **two** baseline distributions exist. |
| **Explainability trace completeness** (mean across cohort findings) | **≥ 0.80** | Metric family `archlucid_explainability_trace_completeness_ratio` / cohort rollup — low mean ⇒ thin justification vs auditors. |
| **Adversarial scenarios** (when added to the corpus) | **Qualitative pass** | Human review for first **two** baseline runs; defer numeric floors until distributions stabilize. |

**Related:** [`MANUAL_QA_CHECKLIST.md`](../quality/MANUAL_QA_CHECKLIST.md) §8.3–8.4, [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md), [`OBSERVABILITY.md`](../library/OBSERVABILITY.md).
