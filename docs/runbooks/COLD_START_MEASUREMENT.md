> **Scope:** Operator runbook — measure Container Apps cold start after CD so paid levers are evidence-gated.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Cold-start measurement runbook

**Objective:** Split **revision create → `/health/ready` Healthy** from **first authenticated business API latency** after a routine deploy. Use the split to decide whether later **paid** levers (CPU, R2R, pre-migrate Jobs, `min_replicas` > 0, Redis) are worth the Azure bill.

**Assumptions:** API on **Azure Container Apps**; CD uses [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md) (post-deploy retries **TB-754**, canary+bake **TB-755**, synthetic warm-path **TB-758**). This runbook does **not** change SKUs.

**Out of scope (document only):** Debian ReadyToRun, pre-migrate Jobs, raising `min_replicas`, Redis — see [decision table](#decision-table-paid-levers) below and the owner **cost × latency matrix** in [`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../library/PERFORMANCE_COLD_START_AND_TRIMMING.md#paid-lever-decision-pack-tb-2124) (**TB-2124**).

---

## What to measure

| Phase | Definition | Why it matters |
|-------|------------|----------------|
| **A — Revision → ready** | Time from new API revision **provisioned** until anonymous `GET /health/ready` returns HTTP **200** and JSON `.status == "Healthy"` | Dominated by container start, DbUp/migrations, SQL/blob connectivity |
| **B — Ready → business warm** | Latency of first authenticated business read after ready (recommended: `GET /api/auth/me` with `X-Api-Key`) | Dominated by auth, tenant scope, JIT, first SQL on app paths |
| **C — CD gate wall clock** | GitHub **Post-deploy validation** attempt count and duration (deployment-evidence + product smoke) | Operator pain during release; improved by **TB-754** retries without Azure spend |

Record **A**, **B**, and **C** on every baseline capture. Compare **before/after** canary (**TB-755**) and synthetic path (**TB-758**) changes.

---

## Procedure 1 — Revision create → `/health/ready` (ACA + CD log)

### A. Azure Container Apps (revision timestamp)

1. Note the API revision name from the CD **Deploy Container Apps** log (`latestRevisionName` after `az containerapp update`) or Portal → Container App → **Revisions**.
2. In Portal → revision → **System logs** / **Console**, note **Created** time (UTC).
3. From a machine that can reach the API (or the CD runner’s smoke URL):

   ```bash
   BASE="https://<api-host>"
   until curl -sf "$BASE/health/ready" | jq -e '.status == "Healthy"'; do sleep 2; done
   ```

   Record **T_ready** (first Healthy response). **Phase A** ≈ `T_ready − T_revision_created`.

**Do not** send `X-Api-Key` on `/health/ready` — a bound admin key can make ready **Unhealthy** when the tenant has no catalog binding (see deployment-evidence comments in `ArchLucid.Cli`).

### B. GitHub Actions (CD-aligned)

1. Open the workflow run → **Deploy Container Apps** → timestamp when `az containerapp update` **starts** for the API.
2. Open **Post-deploy validation** → find `>>> Deployment evidence probe attempt N of M <<<` and the first attempt where all required probes pass.
3. **Phase A (CD view)** ≈ deploy update start → first successful `/health/ready` in deployment-evidence (attempt 1 if green on first try).
4. **Phase C:** note **N** (attempts used) and whether `CD_POST_DEPLOY_MAX_ATTEMPTS` / `CD_POST_DEPLOY_RETRY_WAIT_SECONDS` were exercised (**TB-754**).

When **canary+bake** is on (**TB-755**), subtract **`CD_CANARY_BAKE_MINUTES`** from Phase A if you are measuring *platform* ready time independent of intentional bake delay.

---

## Procedure 2 — First authenticated business API call

After Phase A is Healthy:

```bash
BASE="https://<api-host>"
KEY="<admin X-Api-Key>"
curl -sf -o /dev/null -w "http_code=%{http_code} time_total=%{time_total}s\n" \
  -H "X-Api-Key: $KEY" "$BASE/api/auth/me"
```

Repeat **3×**; record **median `time_total`**. This matches CD when `SMOKE_SYNTHETIC_PATH=/api/auth/me` (**TB-758**).

**Alternative (architect workspace path):** first authenticated list after login (e.g. workspace home) — higher variance; prefer `/api/auth/me` for repeatable baselines.

---

## Procedure 3 — Application Insights (optional)

When the API exports to App Insights, correlate revision deploy with request duration:

```kusto
requests
| where timestamp > ago(2h)
| where url has "/health/ready" or url has "/api/auth/me"
| summarize count(), percentile(duration, 50), percentile(duration, 95) by name, bin(timestamp, 1m)
| order by timestamp desc
```

Use the first minute bucket after a new revision for **A** (ready) and **B** (`/api/auth/me`).

---

## What “good enough” looks like (staging)

These are **staging release-gate** targets, not production SLAs. Adjust only with owner sign-off.

| Signal | Good enough (staging) | Investigate when |
|--------|----------------------|------------------|
| Phase A (revision → ready) | **≤ 90 s** without bake; **≤ 120 s** with 3 min canary bake excluded from platform time | > 120 s platform time on routine CD |
| Phase B (`/api/auth/me` after ready) | **median < 1.0 s** | median ≥ 2.0 s |
| CD deployment-evidence | **Pass on attempt 1–2** with `6` / `10` retries configured | Routinely needs attempt **≥ 4** |
| User-visible 502/503 during deploy | Brief, covered by UI warm-up retry (**TB-757**) | Sustained errors after ready is Healthy |

If staging passes CD reliably but Phase B is high, prefer **JIT/R2R/CPU** evidence before **`min_replicas`**.

---

## Decision table (paid levers)

| Dominant symptom | Likely cause | Free / shipped levers (try first) | Paid lever (evidence-gated) |
|------------------|--------------|-----------------------------------|-----------------------------|
| Phase **A** slow; ready checks mention schema/SQL | DbUp + DB connect | **TB-754** retries; fix connection/Key Vault; **TB-756** avoid no-op revisions | Pre-migrate Job (V1.1+); warmer SQL tier |
| Phase **A** slow; ready healthy quickly in Portal but CD fails early | Traffic on cold revision | **TB-755** canary+bake; **TB-757** UI/proxy retries | Raise `min_replicas` (always-on cost) |
| Phase **B** slow; Phase A fine | JIT / first-request SQL / auth | **TB-758** synthetic smoke; profile with `dotnet-trace` ([`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../library/PERFORMANCE_COLD_START_AND_TRIMMING.md)) | R2R publish; bump CPU; `min_replicas` |
| Scale-from-zero after idle | No running replica | Accept for dev; canary for staging traffic | `min_replicas ≥ 1` |
| Intermittent 502/503 at ingress | Revision swap / platform | **TB-757**, **TB-754** | `min_replicas`, more CPU |

**Rule:** Do not open a paid-lever backlog row until **one baseline row** exists in [`cold-start-baselines/`](../operations/cold-start-baselines/README.md) for the target environment. Owner go/no-go per lever: [`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../library/PERFORMANCE_COLD_START_AND_TRIMMING.md#paid-lever-decision-pack-tb-2124) (**TB-2124**).

---

## When to run

| Trigger | Action |
|---------|--------|
| After routine **staging** CD | Capture baseline row (required for evidence gate) |
| After changing **TB-754** / **TB-755** / **TB-758** vars | Re-capture; note vars in baseline |
| Before proposing **`min_replicas`**, R2R, or pre-migrate Jobs | Compare latest baseline to table above |
| Dev CD (optional) | Allowed as **representative** ACA profile; label environment clearly |

---

## Artifacts and links

| Artifact | Location |
|----------|----------|
| Deployment evidence Markdown | GitHub Actions artifact `deployment-evidence-<env>-<runId>.md` |
| Product smoke timings | Post-deploy log → `cd_post_deploy_product_smoke.py` summary table |
| Baseline register | [`docs/operations/cold-start-baselines/`](../operations/cold-start-baselines/README.md) |
| TB-2146 capture script | `scripts/ops/capture-cold-start-baseline.ps1` (Phase **B** median + scaffold row) |
| TB-2146 owner checklist | `scripts/ops/enable-cold-start-staging-baseline-checklist.ps1` |
| CD pipeline | [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md) |
| Profiling / trimming | [`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../library/PERFORMANCE_COLD_START_AND_TRIMMING.md) |
| Failed deploy / rollback | [`DEPLOYMENT_RUNBOOK.md`](../library/DEPLOYMENT_RUNBOOK.md) |

**Local deployment-evidence (same probes as CD):**

```bash
dotnet run --project ArchLucid.Cli -- deployment-evidence \
  --environment staging \
  --api-base-url "https://<staging-api>" \
  --synthetic-path /api/auth/me \
  --out ./artifacts/deployment-evidence-staging-local.md \
  --repo .
```

Export `ARCHLUCID_API_KEY` when `SMOKE_SYNTHETIC_PATH` is not `/version`.

---

## Cross-references

**TB-754** post-deploy retries · **TB-755** canary+bake · **TB-758** synthetic `/api/auth/me` · **TB-759** (this runbook).
