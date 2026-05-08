# ArchLucid — AI Agent / Readiness Solution Quality — **70.66%** (weighted)

**Date:** 2026-05-08  
**Method:** Independent first-principles review of repo code and docs (no prior assessment cross-reference).  
**Scope label `(A)`:** V1 / V1.1 headline product readiness only. Intentionally **not** scored: MCP membrane (V1.1), Responses API / `IAgentToolLoop` (V1.2 candidate), embedding-based aggregate explanation faithfulness (V2 note in docs), distributed graph projection cache (V2), Durable Task Framework (V2), CPA SOC 2, design partner, Stripe live un-hold, third-party pen test.

**Deferred markdown:** `docs/library/V1_DEFERRED.md` (found and used for scope boundaries).

---

## Owner decisions captured (2026-05-08 follow-up)

These **lock implementation defaults** for the improvements below; they do **not** change the retrospective score until code merges.

| # | Topic | Decision |
|---|--------|----------|
| 1 | Per-agent quality gates | Topology **0.85 / 0.65**, Compliance **0.80 / 0.60**, Cost **0.75 / 0.55**, Critic **0.65 / 0.50** (structural reject below / semantic reject below) |
| 2 | `PilotStrictMinAgentResultFaithfulnessSupportRatio` | **0.7** |
| 3 | Embedding faithfulness | **On in Staging, off in Production** |
| 4 | Per-tenant daily token cap (`HardCutoffTokensPerUtcDay`) | **2,000,000** (UTC day), when implemented |
| 5–6 | `cohort-real-llm-live` | **Scheduled:** weekly **Sunday 06:00 UTC**; **golden cohort monthly cap + 80%/95% kill-switch unchanged** |
| 7 | LLM-as-judge (when added) | **No separate sub-cap** — judge calls draw from the **same monthly LLM pool** as agents |
| 8 | Branch protection | Workflows ship in-repo; **repo admin adds required checks** using exact job names from the PR |
| 9 | Real mode + Production deployment | **Hard fail at startup** if `AgentExecution:Mode=Real` and deployment is missing or simulator/unspecified sentinel |
| 10 | Prompt-injection fixture expansion | **OWASP LLM Top 10–aligned themes**, payloads **rewritten** (not verbatim from a single external source) |
| — | Reasoning-trace redaction default | **Not decided** — see pending at bottom |

---

## 1. Pillar weights (first principles)

| # | Pillar | Weight | Rationale |
|---|--------|-------:|-----------|
| 1 | Output correctness & gating | **24%** | Bad outputs that ship invalidate the product. |
| 2 | Grounding & faithfulness | **16%** | Buyer asks how you prove outputs are not fabricated. |
| 3 | Real-mode evidence | **12%** | Simulator ≠ production credibility. |
| 4 | Cost & budget guardrails | **10%** | Runaway LLM cost is existential. |
| 5 | Resilience & multi-vendor | **10%** | Reduces vendor and reliability blast radius. |
| 6 | Safety, abuse, secrets | **10%** | Enterprise table stakes. |
| 7 | Explainability & trace forensics | **10%** | Auditability for governance buyers. |
| 8 | Eval corpus & prompt regression | **8%** | Continuous quality and drift detection. |

---

## 2. Pillar scores (as implemented in repo at assessment time)

| # | Pillar | Raw | Weighted | Notes |
|---|--------|----:|---------:|-------|
| 1 | Output correctness & gating | **78** | **18.72** | Schema enforcement (`EnforceOnParse`), `PilotStrict` in Staging/Production appsettings, `EnforceOnReject` + `BlockRunOnReject` → HTTP 409, durable audit, persisted warning flags. **Gaps:** semantic heuristics gameable (length thresholds); no per-agent thresholds in code yet; schema enforcement not uniformly default-on. |
| 2 | Grounding & faithfulness | **58** | **9.28** | Token-overlap checkers (`AgentResultEvidenceFaithfulnessChecker`, aggregate `ExplanationFaithfulnessChecker`). **Gaps:** not entailment or embedding in the shipped path; confident paraphrase that reuses evidence tokens can pass. |
| 3 | Real-mode evidence | **60** | **7.20** | Golden cohort nightly, kill-switch probe, structural validator, RC workflows, workbook. **Gaps:** thin committed real-mode corpus; `--enforce-quality-gate` skips real rows by default; live invoke historically dispatch-only (owner now wants schedule — improvement below). |
| 4 | Cost & budget guardrails | **75** | **7.50** | Estimators, quotas, monthly USD tracker, kill-switch, partial-budget exception path. **Gaps:** `LlmMonthlyTenantDollarBudgetTracker` is in-process `ConcurrentDictionary` — not durable across replicas. |
| 5 | Resilience & multi-vendor | **80** | **8.00** | Circuit breaker, fallback, Polly timeouts, multi-provider descriptor, staged Critic. **Gap:** mixed real/fallback runs lack one buyer-visible “degraded” label. |
| 6 | Safety, abuse, secrets | **70** | **7.00** | Azure Content Safety with `FailClosedOnSdkError` option, misconfig guard throws, precheck + redactor, injection regression tests. **Gaps:** small injection corpus; provider `ReasoningTrace` not yet redacted like prompts; fail-closed not pinned everywhere in appsettings. |
| 7 | Explainability & trace forensics | **80** | **8.00** | Blob + inline fallback, audit on blob failure, explainability completeness analyzer, advisory rollup, inspector API. **Gaps:** some engines at 4/5 on `AlternativePathsConsidered`; aggregate fallback not surfaced as a buyer-facing badge. |
| 8 | Eval corpus & prompt regression | **62** | **4.96** | Eval corpus scripts, Topology merge-blocking regression floors, golden fixtures. **Gaps:** Cost / Compliance / Critic prompt-regression floors still 0.0 in baseline until extended; limited adversarial scenarios. |

**Total weighted: 18.72 + 9.28 + 7.20 + 7.50 + 8.00 + 7.00 + 8.00 + 4.96 = 70.66**

---

## 3. Verdict (blunt)

The AI path is **stronger than most pre-GA LLM SaaS**: schema path, blocking quality gate in production-like configs, forensic trace persistence with fallback, cost kill-switch, and multi-provider wiring are real engineering, not slides.

The **commercial ceiling** is still set by three gaps that are **all fixable in the V1 window** and **not** deferred scope: (1) **faithfulness is heuristic overlap**, not truth; (2) **prompt regression is Topology-only** at merge-blocking severity; (3) **real-mode evidence depth** and automation posture lag simulator investment.

Re-scoring **after** your captured decisions ship in code is appropriate; this document’s **70.66%** remains the **as-is** snapshot.

---

## 4. Tradeoffs (summary)

- **Strict gates (incl. faithfulness 0.7)** raise pilot friction and false rejects until prompts and fixtures stabilize — that is intentional for credibility.
- **Embedding on in Staging only** buys regression signal without Production cost/latency — Production stays overlap + gates unless you later opt in.
- **Scheduled `cohort-real-llm-live`** increases unattended spend risk; **mitigation** is the existing monthly cap and kill-switch (unchanged per your decision).
- **Hard-fail Real+Production misconfig** prevents silent “simulator in prod” incidents; it requires disciplined CI/CD for deployment names.
- **LLM-as-judge without a sub-cap** simplifies accounting but makes policy clarity critical: judge is just another completion on the same tenant budget.

---

## 5. Improvements list (updated; highest leverage first)

Locked values reflect **Owner decisions captured** above. Items are ordered **most risk reduction first** (weight × gap), with **Cursor prompts** for agent execution.

### Grounding & faithfulness

**1. COMPLETED:  Embedding-based faithfulness (Staging on, Production off)**  
Implement optional embedding scorer vs evidence; `ArchLucid:Agents:Faithfulness:EmbeddingEnabled=true` in **staging** appsettings only; **false** in production. Record histogram; do not remove token overlap. Wire behind existing completion/embed client patterns; PII review in doc.

*Cursor prompt:* In `ArchLucid.AgentRuntime/Evaluation/`, add an embedding-based faithfulness path behind `ArchLucid:Agents:Faithfulness:EmbeddingEnabled`, **default true in `appsettings.Staging.json`, false in `appsettings.Production.json`**. Use existing or new `IOpenAiEmbeddingClient`; chunk claims and evidence; cosine similarity; new nullable field on semantic score DTO; OTel histogram; tests with fake embedder; update `docs/library/AGENT_OUTPUT_EVALUATION.md`. Regenerate OpenAPI + Api.Client + `npm run generate:api-types` if wire contract changes.

**2. COMPLETED:  Adversarial eval-corpus scenarios**  
Add hallucination, citation forgery, contradictory-manifest scenarios with `--enforce` rules as previously specified.

*Cursor prompt:* Add `scenario-hallucinated-service.json`, `scenario-citation-forgery.json`, `scenario-contradictory-manifest.json` under `tests/eval-corpus/` with recordings, optional simulator `agent-results`, manifest entries, ≥3 expected / ≥2 unexpected rules each; run `eval_agent_corpus.py` locally; update `docs/library/AGENT_EVAL_CORPUS.md`.

**3. Mandatory faithfulness floor 0.7 (Staging + Production)**  
Set `PilotStrictMinAgentResultFaithfulnessSupportRatio` to **0.7** in `appsettings.Staging.json` and `appsettings.Production.json`; validate `PilotStrict` requires non-null floor.

*Cursor prompt:* Set `ArchLucid:AgentOutput:QualityGate:PilotStrictMinAgentResultFaithfulnessSupportRatio` to **0.7** in Staging and Production JSON. Add options validation throwing when `Mode=PilotStrict` and floor null. Tests + `AGENT_OUTPUT_EVALUATION.md`.

### Output correctness & gating

**4. Per-agent quality gate overrides (locked numbers)**  
Topology **0.85/0.65**, Compliance **0.80/0.60**, Cost **0.75/0.55**, Critic **0.65/0.50**.

*Cursor prompt:* Extend `AgentOutputQualityGateOptions` with per-agent-type override map (separate override class file). Apply in `AgentOutputQualityGate`. Production JSON entries for all four. Unit tests per agent + fallback. Update `docs/library/AGENT_OUTPUT_EVALUATION.md`.

**5. JSON Schema structured output (feature-flag)**  
Azure OpenAI `json_schema` / strict mode when supported; fallback on 400.

*Cursor prompt:* Flag `ArchLucid:Llm:UseJsonSchemaResponseFormat` in `AzureOpenAiCompletionClient`; embed `schemas/agentresult.schema.json`; catch unsupported; tests. Update eval doc.

**6. `EnforceOnParse=true` in Staging + Production**  
Reject invalid `AgentResult` JSON at parse time in prod-like hosts; startup warn if disabled there.

*Cursor prompt:* Merge `AgentExecution:SchemaValidation:EnforceOnParse=true` into Staging/Production appsettings; validation helper; Api test; CONFIGURATION_REFERENCE + AGENT_OUTPUT_EVALUATION.

### Real-mode evidence & automation

**7. Expand committed real-mode exemplars**  
One Web-serialized `AgentResult` per agent type (Topology, Cost, Compliance, Critic) + scenarios with `qualityEvidence.mode: "real"` and distinct env vars.

*Cursor prompt:* Add four scenarios + four `*.real.json` under `tests/eval-corpus/`; manifest; document env vars in `run_eval_agent_corpus_rc.sh` header; update `AGENT_EVAL_CORPUS.md`.

**8. `--enforce-real-quality-gate` for RC**  
Optional flag so real-mode rows can fail RC on rejected gate (owner-approved strictness).

*Cursor prompt:* Extend `scripts/ci/eval_agent_corpus.py`; wire RC script and workflow; document.

**9. Schedule `cohort-real-llm-live` (Sunday 06:00 UTC)**  
**Owner decision:** weekly schedule; **budget/kill-switch unchanged**. Still requires secrets (`ARCHLUCID_GOLDEN_COHORT_API_HOST`, etc.) in a protected environment — document in PR; keep dispatch as optional override.

*Cursor prompt:* In `.github/workflows/golden-cohort-nightly.yml` (or dedicated workflow file per repo layout), add `schedule: cron: '0 6 * * 0'` (Sunday 06:00 UTC) for job `cohort-real-llm-live`, gated by repo variables (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`, `run_live_invoke` or equivalent) so it does not run without enabling. Preserve `workflow_dispatch`. Update `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` §2 and stop-and-ask if anything contradicts “dispatch-only” text.

### Eval corpus & prompt regression

**10. Merge-blocking floors for Cost / Compliance / Critic**  
Golden fixtures + `prompt_regression_baseline.json` + `assert_prompt_regression.py` + contract tests.

*Cursor prompt:* Add three golden JSON files; raise `min*ByAgentType`; extend `agent-reference-baselines.json`; tests; `AI_AGENT_PROMPT_REGRESSION.md`.

**11. Prompt-injection corpus expansion (OWASP-aligned, rewritten)**  
Add five+ fixtures; **`--enforce-prompt-injection-block-layer`** (or equivalent) in CI per plan; tests.

*Cursor prompt:* New JSON under `tests/eval-datasets/prompt-injection/` using **OWASP-style attack categories** with **original phrasing** (not copy-paste). Extend manifest; `eval_agent_quality.py` strict enforcement flag; `PromptInjectionExecutableRegressionTests` coverage. PR lists **exact GitHub Actions job/check names** for branch protection (owner enables).

### Safety & secrets

**12. `FailClosedOnSdkError=true` in Staging + Production appsettings**  
Align Content Safety with fail-closed in prod-like profiles.

*Cursor prompt:* Merge ContentSafety block; options validation warns on unsafe prod config; tests; CONFIGURATION_REFERENCE.

**13. Redact `ReasoningTrace` before persistence (pending default)**  
Apply `IPromptRedactor` to provider reasoning when flag true; **default:** TBD until owner picks Staging+Prod on / Dev off vs always-on.

*Cursor prompt:* _(Hold until reasoning-trace default answered.)_ Implement `ArchLucid:Llm:RedactReasoningTrace`; wire in `RealAgentExecutor.MergeProviderReasoningTrace`; tests; `LLM_PROMPT_REDACTION.md`.

### Cost & fairness

**14. Durable monthly USD tracker (SQL)**  
Replace or back multi-replica `ConcurrentDictionary` spend with SQL + rowversion retry.

*Cursor prompt:* Table `dbo.LlmMonthlyTenantBudgetState`, migration + `ArchLucid.sql`; repository; refactor tracker; tests.

**15. Per-tenant daily token cap — 2M default**  
`LlmDailyTenantTokenWindowOptions` + SQL state; **default `HardCutoffTokensPerUtcDay: 2000000`** in Production when shipped.

*Cursor prompt:* New options, table, tracker, integration with pre-call checks; tests; CONFIGURATION_REFERENCE.

### Explainability & UX

**16. Backfill `AlternativePathsConsidered`**  
Engines at 4/5 get sentinel or concrete branches per `EXPLAINABILITY_TRACE_COVERAGE.md`.

*Cursor prompt:* Edit four engines; update matrix doc; Decisioning tests.

**17. Surface aggregate explanation fallback in API + UI**  
`DeterministicFallbackUsed` on run explanation summary; badge in operator UI.

*Cursor prompt:* Extend DTO; OpenAPI snapshot; Api.Client; `npm run generate:api-types`; Vitest.

### Resilience & clarity

**18. Run-level `RunDegradedExecution` + agent list**  
From trace metadata (simulator sentinels + new `UsedFallback` if needed).

*Cursor prompt:* Migration optional column; `FallbackAgentCompletionClient` sets flag; run summary API; UI badge; tests; HTTP surface follow-through.

**19. Honor `Retry-After` on Azure OpenAI 429**  
Exact backoff vs generic Polly.

*Cursor prompt:* Change `AzureOpenAiCompletionClient`; counter `archlucid_llm_rate_limit_total`; test with fake 429.

### Cross-cutting

**20. Clarify `archlucid_agent_output_semantic_score` meaning**  
Histogram description + UI tooltips: heuristic, not truth/embeddings.

*Cursor prompt:* Instrumentation description; `OBSERVABILITY.md`; UI strings.

**21. LLM-as-judge (opt-in)**  
Register judge for Topology + Critic only; **same monthly pool as agents** (no sub-cap); cap total calls via existing quota if needed.

*Cursor prompt:* Wire `IAgentOutputLlmSemanticJudge` behind `ArchLucid:Agents:LlmJudge:Enabled`; rubric prompt; accounting via `LlmCompletionAccountingClient`; tests with stub; doc — explicitly **no separate budget bucket**.

**22. Quality-rejected Problem Details**  
409 body with stable `type`, support hint, link to new runbook.

*Cursor prompt:* Find `ExecutionCompletedQualityRejected` / 409 path; extend ProblemDetails; add `docs/runbooks/QUALITY_GATE_REJECTION.md`; Api snapshot test.

**23. Production startup: Real mode deployment fingerprint (hard fail)**  
If `AgentExecution:Mode=Real` and environment is Production (and Staging if you want parity), fail startup when deployment name is empty or equals `AgentExecutionTraceModelMetadata` simulator/unspecified sentinels.

*Cursor prompt:* `RealModeDeploymentFingerprintRules` at host startup; Composition tests; CHANGELOG; `AGENT_TRACE_FORENSICS.md`.

**24. Surface faithfulness ratio in operator UI**  
`GET …/agent-evaluation` field exposed as tiered badge (grounding heuristic disclaimer).

*Cursor prompt:* Run detail agent-eval table; Vitest; no API break unless already present.

**25. CI: prompt-injection + full agent regression as named jobs**  
Jobs must be **listed by exact name in PR** for admin to mark required (per owner decision).

*Cursor prompt:* Add or extend `ci.yml` steps; ensure job `id` matches what branch protection expects; PR template note.

---

## 6. Still pending (one item)

- **Reasoning-trace redaction default:** Staging+Production **on**, Development **off** vs **always-on** vs other — reply when ready and item **13** unlocks.

---

## 7. References (in-repo)

- `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`  
- `docs/library/AGENT_OUTPUT_EVALUATION.md`, `docs/library/AGENT_EVAL_CORPUS.md`, `docs/library/AI_AGENT_PROMPT_REGRESSION.md`  
- `docs/library/AGENT_TRACE_FORENSICS.md`, `docs/library/EXPLAINABILITY_TRACE_COVERAGE.md`, `docs/library/EXPLAINABILITY.md`  
- `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`  
- `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`

---

*End of assessment.*
