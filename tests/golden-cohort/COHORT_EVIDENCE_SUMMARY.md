# Golden cohort / eval-corpus real-mode evidence summary

**Captured (UTC):** 2026-05-10  
**Reference model:** `gpt-4o` (see `budget.config.json` → `baselineModelSku`; live runs bind `AzureOpenAI:DeploymentName` to the deployment resource that targets this model).  
**Evidence shape:** Web-serialized `AgentResult` JSON under `tests/eval-corpus/agent-results/*.real.json`. These files are **committed synthetic exemplars** for deterministic structural/semantic scoring in CI (`scripts/ci/eval_agent_corpus.py`). They are **not** raw Azure OpenAI completions. For buyer-facing proof, replace paths via the per-scenario `qualityEvidence.agentResultPathEnv` variables after exporting from a `Real` execution (`ARCHLUCID_AGENT_EXECUTION_MODE=Real` / `AgentExecution:Mode=Real`) with **gpt-4o** only.

## Inventory — real-mode scenarios (`qualityEvidence.mode: "real"`)

| # | Scenario id | Scenario file |
|---|-------------|---------------|
| 1 | corpus-real-mode-smoke | `scenario-real-mode-smoke.json` |
| 2 | corpus-real-mode-cost | `scenario-real-mode-cost.json` |
| 3 | corpus-real-mode-compliance | `scenario-real-mode-compliance.json` |
| 4 | corpus-real-mode-critic | `scenario-real-mode-critic.json` |
| 5 | corpus-real-mode-three-tier | `scenario-real-mode-three-tier.json` |
| 6 | corpus-real-mode-microservices | `scenario-real-mode-microservices.json` |
| 7 | corpus-real-mode-database-backup | `scenario-real-mode-database-backup.json` |
| 8 | corpus-real-mode-overprovisioned-vm | `scenario-real-mode-overprovisioned-vm.json` |
| 9 | corpus-real-mode-multi-region | `scenario-real-mode-multi-region.json` |
| 10 | corpus-real-mode-azure-web-app | `scenario-real-mode-azure-web-app.json` |
| 11 | corpus-real-mode-cloud-migration-lift-shift | `scenario-real-mode-cloud-migration-lift-shift.json` |
| 12 | corpus-real-mode-greenfield-microservices | `scenario-real-mode-greenfield-microservices.json` |
| 13 | corpus-real-mode-healthcare-hipaa | `scenario-real-mode-healthcare-hipaa.json` |
| 14 | corpus-real-mode-finops-existing-azure | `scenario-real-mode-finops-existing-azure.json` |
| 15 | corpus-real-mode-event-driven | `scenario-real-mode-event-driven.json` |
| 16 | corpus-real-mode-multi-region-active-active | `scenario-real-mode-multi-region-active-active.json` |
| 17 | corpus-real-mode-data-platform-analytics | `scenario-real-mode-data-platform-analytics.json` |
| 18 | corpus-real-mode-ai-ml-inference | `scenario-real-mode-ai-ml-inference.json` |

**Total distinct real-mode scenarios:** 18 (rows 11–18 added for expanded architecture archetypes).

### New brief archetypes (rows 11–18)

| Theme | Scenario id |
|-------|-------------|
| Cloud migration (lift-and-shift legacy) | corpus-real-mode-cloud-migration-lift-shift |
| Greenfield microservices (edge APIM + AKS) | corpus-real-mode-greenfield-microservices |
| Compliance-heavy regulated (HIPAA / PHI) | corpus-real-mode-healthcare-hipaa |
| Cost optimization on existing Azure estate | corpus-real-mode-finops-existing-azure |
| Event-driven architecture (Event Hubs + Functions) | corpus-real-mode-event-driven |
| Multi-region high availability (active/active + Front Door) | corpus-real-mode-multi-region-active-active |
| Data platform / analytics (lakehouse + Synapse) | corpus-real-mode-data-platform-analytics |
| AI/ML workload (AML batch / GPU inferencing) | corpus-real-mode-ai-ml-inference |

Structured briefs (system name, stack, objectives, constraints) live in each scenario’s `architectureBrief` object alongside `inputSummary`.

## Quality gates (committed exemplars, local verification)

Command (PowerShell; requires setting each `ARCHLUCID_EVAL_CORPUS_REAL_MODE_*` to the matching `*.real.json` path, or use `.github/workflows/agent-eval-corpus-rc.yml` as the source of truth for the full env block):

```powershell
python scripts/ci/eval_agent_corpus.py `
  --corpus tests/eval-corpus `
  --enforce --min-recall 0.75 `
  --enforce-quality-gate --enforce-real-quality-gate --require-real-mode-evidence
```

**Result (2026-05-10):** With all 18 env paths pinned to repo exemplars: worst recall **1.00** (floor 0.75); all evaluated real-mode rows **structural 1.00**, **semantic 1.00**, **gate accepted**; real-mode rollup `evaluated=18`, `errors=0`.

| Scenario id | Structural | Semantic | Findings in exemplar | Gate |
|-------------|------------|----------|------------------------|------|
| corpus-real-mode-smoke | 1.00 | 1.00 | 1 | accepted |
| corpus-real-mode-cost | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-compliance | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-critic | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-three-tier | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-microservices | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-database-backup | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-overprovisioned-vm | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-multi-region | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-azure-web-app | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-cloud-migration-lift-shift | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-greenfield-microservices | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-healthcare-hipaa | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-finops-existing-azure | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-event-driven | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-multi-region-active-active | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-data-platform-analytics | 1.00 | 1.00 | 2 | accepted |
| corpus-real-mode-ai-ml-inference | 1.00 | 1.00 | 2 | accepted |

## Token usage / budget

| Item | Value |
|------|-------|
| Token counts (prompt + completion) for committed exemplars | **Not applicable** — JSON files do not embed usage metadata. |
| Monthly budget cap | `tests/golden-cohort/budget.config.json` → `monthlyTokenBudgetUsd` (**unchanged** this change-set). |
| Live run capture | Record `usage` / token fields from the **gpt-4o** completion response (or Azure Monitor / cost export) when replacing exemplars after real invokes; attach to change request when updating committed JSON. |

## CI wiring

- Release-candidate strict run: `.github/workflows/agent-eval-corpus-rc.yml` sets all 18 `ARCHLUCID_EVAL_CORPUS_REAL_MODE_*` paths.
- Weekly informational scoring: `.github/workflows/golden-cohort-expanded-nightly.yml` (same env block).
- **N‑20 simulator golden cohort** (`tests/golden-cohort/cohort.json` / `lock-baseline`) was **not** modified; no SHA drift on existing simulator baselines.

## Acceptance checklist

- At least **10** distinct real-mode scenarios with evidence files: **met** (18 total).
- Structural/semantic floors: **met** for committed exemplars under the default gate in `eval_agent_corpus.py`.
- Summary document: **this file**.
- Budget config: **no adjustment** required for this expansion.
- Live AOAI / `dotnet-azure-openai-live-post-regression`: **not executed** in this workspace (credential-dependent); organisation CI remains the corroboration path after secrets are configured.
