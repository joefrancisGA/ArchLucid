> **Scope:** Monthly **USD** spend cap and **kill switch** for the optional **real-LLM** golden-cohort nightly path (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`). Simulator drift (default CI) is unchanged and does not hit Azure OpenAI.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Golden cohort Azure OpenAI budget and kill switch

## Decision (2026-04-22)

Owner Q&A ([`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) items **15** / **25**): dedicated golden-cohort Azure OpenAI usage is capped at **$50 / calendar month**, with a **kill switch at 90%** (**$45** MTD) so nightly real-LLM work **cannot run away** once keys are injected and `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`.

**Currency:** the probe reads **Cost Management `ActualCost`** for the filtered resource. The numeric cap in `budget.config.json` is expressed in **USD** in-repo; ensure the subscription’s Cost Management **billing currency** matches your intent (use a USD-billed subscription for this cohort, or edit the cap and this doc to match another currency).

## Configuration (repo)

| File | Purpose |
| ---- | ------- |
| [`tests/golden-cohort/budget.config.json`](../../tests/golden-cohort/budget.config.json) | `monthlyTokenBudgetUsd` (cap), `killSwitchThresholdPercent` (default **90**), `deploymentName` / `region` placeholders for humans (Cost Management filters by **resource ARM id**, not deployment name alone). |

**Raising the cap (owner-only PR):** edit `monthlyTokenBudgetUsd` and/or `killSwitchThresholdPercent`, merge with security review, and align any buyer-facing narrative so the repo stays honest about spend.

## Probe script

[`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py) reads the JSON config and queries **Azure Cost Management** (`ActualCost`, **MonthToDate**) for the Cognitive Services account ARM id in **`ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID`**, using **`requests`** only (no new Azure SDK in-repo).

**Authentication (in order):**

1. `ARCHLUCID_ARM_ACCESS_TOKEN` or `AZURE_MANAGEMENT_ACCESS_TOKEN` — bearer token for `https://management.azure.com/`.
2. Otherwise **`az account get-access-token --resource https://management.azure.com/`** (after `az login` or GitHub **`azure/login`**).

**Subscription:** `AZURE_SUBSCRIPTION_ID` if set; else parsed from the resource id path.

**Exit codes**

| Code | Meaning |
| ---- | ------- |
| **0** | MTD cost **below** the kill threshold (under **90%** of cap by default). |
| **1** | MTD **≥ 90%** and **< 100%** of cap — **kill switch**; do not run real-LLM cohort. |
| **2** | MTD **≥ 100%** of cap — hard stop. |
| **3** | Probe could not run (missing resource id, token, or Cost Management error). |

Machine-readable lines are printed for CI:

- `EXPORT_MTD_USD=…`
- `EXPORT_BUDGET_USD=…`
- `EXPORT_KILL_THRESHOLD_USD=…`
- `EXPORT_EXIT_CODE=…`

**Local smoke (no Azure):** `ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD=46.5 python scripts/golden_cohort_budget_probe.py`

## GitHub Actions

Workflow: [`.github/workflows/golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml), job **`cohort-real-llm-gate`**.

**Both gates must pass** for the real-LLM path to be eligible:

1. Repository variable **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** must be **`true`** (job `if:`).
2. The **budget probe** must exit **0** (MTD under the kill threshold).

If the probe exits **1** or **2**, later steps are **skipped** and the job summary includes the MTD line. Exit **3** skips the cohort and records a probe-failure summary (fix credentials, RBAC, or resource id).

**Secrets / login (owner):** configure **`azure/login`** inputs (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) and repository/ environment secret **`ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID`** (full ARM id of the **Microsoft.CognitiveServices/accounts** resource). The service principal (or federated identity) needs **Cost Management read** on the subscription (e.g. **Cost Management Reader**).

## When the kill switch fires

1. **Wait** until the next **calendar month** resets MTD actual cost (Cost Management MonthToDate), then re-run the workflow; or  
2. **Owner approval** to **temporarily raise** the cap in `budget.config.json` (PR + documented rationale), then redeploy; or  
3. **Reduce** usage elsewhere on the same resource if the cap is shared (not recommended—prefer a **dedicated** cohort account per decision).

## Where this does **not** apply

- **Simulator** drift (`cohort-simulator-drift`) does not call Azure OpenAI and is not gated by this probe.
- **Private keys** for OpenAI stay in the owner environment / Key Vault / GitHub secrets model you already use for the product—this runbook only gates **spend visibility** for the cohort resource.
