> **Scope:** Rolling-window procedure for interpreting scheduled **hosted-saas-probe** workflow results — **no buyer-facing availability % without real history**.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Hosted availability — 30-day rollup (operator runbook)

**Audience:** Platform / SRE assembling procurement- or Trust-Center-adjacent **reliability narrative** from scheduled HTTP probes.

## Objective

Summarize **whether** the public health endpoints (`/health/live`, `/health/ready`) for the configured staging base URL succeeded on each scheduled run, over a chosen window (e.g. **30 days**), **without** implying a production SLA unless that environment is explicitly in scope.

## Inputs

- GitHub Actions workflow **[`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml)** (cron + `workflow_dispatch`).
- Repository variable **`ARCHLUCID_STAGING_BASE_URL`**. When unset, the workflow exits cleanly and records a **skipped** probe artifact row.
- Per-successful-probe artifact **`probe-out/probe-result.json`** (UTC timestamp + base URL + endpoint results) uploaded from the workflow when probing runs.

## Procedure

1. In the Actions tab, filter **hosted-saas-probe** to the last **30** completed runs (or your reporting window).
2. Download artifacts for runs that **uploaded** `probe-result.json` (skipped runs still produce a small JSON with `"skipped": true` when implemented).
3. Count: **attempted** probes vs **both endpoints OK** vs **skipped** (no base URL).
4. Record in internal release notes or procurement Q&A: **method** (scheduled curl, staging-only), **window dates**, **counts** — not a polished **%** unless your legal/comms policy allows that wording for **staging**.

## Constraints

- **Do not** publish **“99.x% availability”** to buyers from this probe alone: it is **not** production monitoring, not multi-region, and not user-traffic SLO-backed.
- For buyer-facing language, pair with [TRUST_CENTER.md](../go-to-market/TRUST_CENTER.md) posture and any **separate** production telemetry your organization approves.

## Optional automation (markdown rollup)

Use **`scripts/ops/summarize_hosted_probe_artifacts.py`** to merge multiple downloaded `probe-result.json` files (or a directory tree of them), an optional CSV export, or **stdin** (one JSON object per line) into a **markdown** or text summary.

```bash
# Markdown to stdout (default), staging rollup from a folder of downloaded artifacts
python3 scripts/ops/summarize_hosted_probe_artifacts.py path/to/downloaded/run-a.json path/to/run-b.json

# Same, write to a file for attaching to an internal note or release bundle
python3 scripts/ops/summarize_hosted_probe_artifacts.py --format markdown -o /tmp/hosted-probe-rollup-30d.md path/to/json/dir

# CSV input (header: probedAtUtc,skipped,live_ok,ready_ok[,baseUrl])
python3 scripts/ops/summarize_hosted_probe_artifacts.py --csv path/to/probes.csv -o rollup.md

# Legacy one-line metrics (no markdown)
python3 scripts/ops/summarize_hosted_probe_artifacts.py --format text path/to/run-001.json
```

The script **does not** call GitHub or Azure APIs; it only reads local files. It labels **environment** (staging / production / unknown) from `baseUrl` heuristics, separates **published SLO target** (from `docs/library/API_SLOS.md` / `docs/library/SLA_TARGETS.md`) from **achieved probe uptime**, and includes standard **“not a contractual SLA”** wording.

**Fixture examples** checked into the repo: `scripts/fixtures/hosted_probe_rollup/` (used by `scripts/ci/tests/test_summarize_hosted_probe_artifacts.py`).

## Where to store the generated artifact

| Store | Use |
|-------|-----|
| **Internal only** (default) | Release engineering notes, weekly platform check-ins, private procurement working folders. Prefer a dated filename, e.g. `hosted-probe-rollup-2026-05-01_2026-05-30-utc.md`, and keep alongside the **source** `probe-result.json` files. |
| **Buyer / Trust Center–adjacent** | **Do not** paste staging rollup percentages into buyer-facing pages as “production availability.” If leadership approves **production** probe rollups backed by non-staging URLs and consistent methodology, cite the **method** and link to [`docs/go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) + this runbook — still **not** a CPA or contract SLA claim unless the order form explicitly ties to measured minutes. |
| **Version control** | Only commit rollups if the repo policy allows operational artifacts; otherwise keep in secure storage or the procurement **pack** attach area. Never commit **staging** rollup numbers as **production** evidence. |

**CI / regression:** `python -m pytest scripts/ci/tests/test_summarize_hosted_probe_artifacts.py`
