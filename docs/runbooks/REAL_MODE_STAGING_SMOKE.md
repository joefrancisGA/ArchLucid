> **Scope:** Operator instructions for the optional nightly **real-mode staging smoke** path (assessment Tier 2 #7): budget-capped agent execution probe against hosted staging. Pair with [`GOLDEN_COHORT_REAL_LLM_GATE.md`](./GOLDEN_COHORT_REAL_LLM_GATE.md) for kill-switch semantics.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Real-mode staging smoke — operator runbook

## 1. What this smoke does

Hosted ArchLucid SaaS (**staging**) runs agents in **real mode** (platform Azure OpenAI). Merge-blocking CI stays on **simulator mode** for determinism. This nightly job proves staging still completes a minimal review execution end-to-end without waiting for a manual owner session.

| Component | Purpose |
|-----------|---------|
| **`archlucid real-mode smoke --staging`** | Pure-HTTP CLI: health → create run → execute (pilot real-mode header) → poll until `ReadyForCommit` → verify persisted LLM token totals &gt; 0 |
| **[`.github/workflows/real-mode-staging-smoke-nightly.yml`](../../.github/workflows/real-mode-staging-smoke-nightly.yml)** | Nightly cron **`25 5 * * *` UTC** + `workflow_dispatch`; budget probe then CLI smoke |
| **Budget probe** | Reuses [`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py) ($15/mo cap, 80% warn / 95% kill) — same Q15-conditional rule as golden cohort |

The smoke **does not commit** the run (cost and governance scope stay minimal). It stops at `ReadyForCommit` with agent results present.

## 2. Enable unattended nightly runs

1. Create or reuse a **staging service API key** scoped to a dedicated smoke tenant (Operator role sufficient).
2. Set repository **secret** `ARCHLUCID_STAGING_SMOKE_API_KEY` to that key.
3. Set repository **variable** `ARCHLUCID_REAL_MODE_STAGING_SMOKE_ENABLED` to **`true`**.
4. Ensure Azure federated login secrets used by the budget probe are present (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID`) — same as [`golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml).
5. Run **`workflow_dispatch`** once and confirm a **`PASS`** one-line summary before relying on the cron.

Optional:

| Setting | Default | Notes |
|---------|---------|-------|
| `vars.ARCHLUCID_STAGING_API_BASE_URL` | `https://staging.archlucid.net` | Override API host |
| `secrets.STAGING_ONCALL_WEBHOOK_URL` | unset | Failure paging (soft no-op when unset) |

## 3. Manual pre-flight (sales engineer / on-call)

```powershell
$env:ARCHLUCID_API_KEY = '<staging-smoke-api-key>'
dotnet run --project ArchLucid.Cli -- real-mode smoke --staging
```

Expected greppable line:

```text
PASS host=https://staging.archlucid.net correlation=<id> runId=<guid> status=ReadyForCommit tokens=<n> failed=<none>
```

Use `correlation=` to span API logs and `dbo.AuditEvents` for the run.

Local simulator API (no token requirement):

```powershell
dotnet run --project ArchLucid.Cli -- real-mode smoke --api-base-url http://127.0.0.1:5000 --allow-simulator
```

## 4. Budget kill-switch interaction

| Probe exit | Behavior for this workflow |
|------------|----------------------------|
| **0** | Smoke runs |
| **1** (WARN) | Smoke runs; monitor MTD spend |
| **2** (KILL) | Smoke **skipped**; workflow stays **green** |
| **3** (probe failed) | Smoke **skipped**; workflow stays **green** |

See [`GOLDEN_COHORT_REAL_LLM_GATE.md`](./GOLDEN_COHORT_REAL_LLM_GATE.md) §3 for owner response playbooks.

## 5. Stop-and-ask boundaries

Do **not** automate from this runbook:

- Provisioning Azure OpenAI deployments or rotating production AOAI keys
- Enabling the nightly cron before one green manual `workflow_dispatch`
- Weakening budget warn/kill ratios (blocked at merge by `assert_golden_cohort_kill_switch_present.py`)

## 6. Related assets

- Simulator staging authority smoke (commits): [`scripts/staging-smoke.ps1`](../../scripts/staging-smoke.ps1)
- Real-mode local benchmark: [`scripts/benchmark-real-mode-e2e.ps1`](../../scripts/benchmark-real-mode-e2e.ps1)
- Trial funnel staging smoke (Stripe TEST): [`TRIAL_FUNNEL_END_TO_END.md`](./TRIAL_FUNNEL_END_TO_END.md) § 9.1
