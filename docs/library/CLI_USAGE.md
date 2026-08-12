> **Scope:** Customer-facing — ArchLucid CLI Reference - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid CLI Reference

Reference for the ArchLucid CLI: commands, configuration, and API URL behavior.

## Running the CLI

Install the global .NET tool (after `dotnet pack` or from your distribution channel):

```bash
archlucid <command> [options]
```

<details>
<summary>Building from source (contributor checkout)</summary>

From the solution root when you have the ArchLucid repository checked out:

```bash
dotnet run --project ArchLucid.Cli -- <command> [options]
```

</details>

### Global `--json`

Place **one or more** `--json` flags **before** the subcommand for machine-readable errors on stderr and (for `health`) a JSON success line on stdout:

```bash
archlucid --json health
```

Subcommands that define their own `--json` (for example `archlucid comparisons list --json`) are unchanged — only **leading** `--json` tokens set global JSON mode.

---

## API URL

The CLI talks to the ArchLucid API over HTTP. Resolution order:

1. **`apiUrl`** in `archlucid.json` (if set)
2. **`ARCHLUCID_API_URL`** environment variable
3. **No default** — when both are unset, commands that need an API base URL exit with configuration error **2** until you set one (example: `https://<your-archlucid-host>`).

A trailing slash is trimmed (e.g. `https://<your-archlucid-host>/` → `https://<your-archlucid-host>`).

The API must be reachable for `run`, `status`, `trace`, `run-support-packet`, `submit`, `commit`, `artifacts`, `first-value-report`, `reference-evidence` (alias **`proof-pack`**), `graph export`, `health`, `doctor` / `check`, and **`support-bundle`**. Use `health` for a quick ping (`GET /health`); use **`doctor`** (alias **`check`**) for liveness + readiness JSON and local project checks (`GET /health/live`, `GET /health/ready`).

**Quarterly board-pack PDF (`ExecuteAuthority`, Standard tier):** `POST /v1/pilots/board-pack.pdf` with JSON body `{ "year": 2026, "quarter": 1 }` returns `application/pdf`. Example (bash) with scope headers + API key:

```bash
curl -sS -X POST "$ARCHLUCID_API_URL/v1/pilots/board-pack.pdf" \
  -H "Authorization: Bearer $ARCHLUCID_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" -H "x-workspace-id: $WORKSPACE_ID" -H "x-project-id: $PROJECT_ID" \
  -d '{"year":2026,"quarter":1}' \
  --output board-pack-Q1-2026.pdf
```

---

## Commands

### Set up

| Command | Scope | Description |
|--------|-------|-------------|
| `completions bash` \| `zsh` \| `powershell` | — | Print a shell completion script to stdout (source from your profile). |
| `new <projectName>` | — | Create a new project: `archlucid.json`, `inputs/brief.md`, `outputs/`, `plugins/plugin-lock.json`, optional Terraform stubs, `docs/README.md`. Set `apiUrl` or `ARCHLUCID_API_URL` before API commands. |
| `second-run <SECOND_RUN.toml\|json> [--api-base-url <url>] [--ui-base-url <url>] [--no-open] [--commit-deadline <secs>]` | ExecuteAuthority | Adoption path from demo to a real committed run using a one-page TOML/JSON file. See **`second-run`** workflow in product onboarding docs. |
| `trial smoke --org <name> --email <email> [--display-name <name>] [--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--skip-pilot-run-deltas]` | — | Pure-HTTP smoke loop for the **public trial signup funnel** against any hosted API. Calls **`POST /v1/register`** → **`GET /v1/tenant/trial-status`** → optional pilot-run deltas. **No Docker on your laptop.** Honors global **`--json`**. See **[archlucid trial smoke](#archlucid-trial-smoke)**. |

### Run a review

| Command | Scope | Description |
|--------|-------|-------------|
| `commit <runId>` | ExecuteAuthority | **Finalize** the architecture package (API verb remains `commit`) — merge results and produce a versioned package/manifest. |
| `run` | ExecuteAuthority | Submit an architecture request. Reads `archlucid.json` and `inputs/brief.md` from current directory. Optional **`--idempotency-key <uuid>`** sends the **`Idempotency-Key`** header on **`POST /v1/architecture/request`** (200 replay returns **`X-Idempotency-Replayed: true`** — same semantics as the architect workspace wizard). |
| `status <runId>` | ReadAuthority | Show run status, tasks, and submitted results. |
| `submit <runId> <result.json>` | ExecuteAuthority | Submit an agent result for a run (JSON must match `AgentResult` schema). |

### Retrieve evidence

| Command | Scope | Description |
|--------|-------|-------------|
| `artifacts <runId>` | ReadAuthority | Fetch and display the finalized architecture package (committed manifest). |
| `artifacts <runId> --save` | ReadAuthority | Same, and save manifest to `outputs/manifest-{version}.json` (requires project dir). |
| `comparisons diagnostics` | ReadAuthority | Show recent replay activity (requires replay diagnostics permission). |
| `comparisons drift <comparisonRecordId>` | ReadAuthority | Run drift analysis for a saved comparison record. |
| `comparisons list` | ReadAuthority | List/search persisted comparison records (supports paging and filters). |
| `comparisons replay <comparisonRecordId>` | ReadAuthority | Replay a saved comparison record and export it again to a file (Markdown/HTML/DOCX/PDF depending on type). |
| `comparisons replay-batch <id1,id2,...>` | ReadAuthority | Replay multiple comparison records and download a ZIP of the exported artifacts. |
| `comparisons summary <comparisonRecordId>` | ReadAuthority | Get the stored summary (or regenerated markdown) for a comparison record. |
| `comparisons tag <comparisonRecordId>` | ReadAuthority | Update label and tags on a comparison record. |
| `first-value-report <runId> [--save]` | ReadAuthority | Downloads sponsor Markdown from **`GET /v1/pilots/runs/{runId}/first-value-report`** (`text/markdown`). Prints to stdout, or writes `first-value-{runId}.md` in the current directory with **`--save`**. Uses **`ARCHLUCID_API_URL`** / **`ARCHLUCID_API_KEY`** like other CLI commands. |
| `graph export <runId> [--format mermaid\|graphml] [--decision <key>] [--out <path>]` | ReadAuthority | Fetch the provenance knowledge graph from **`GET /v1/authority/runs/{runId}/graph`** (or **`…/graph/decision/{decisionKey}`** when **`--decision`** is set) and emit **Mermaid** flowchart (default) or **GraphML** XML. Writes to stdout or **`--out`**. Requires a GUID **`runId`**. |
| `reference-evidence --run <runId> [--out <dir>] [--include-demo]` | ReadAuthority | Writes a **reference-evidence** folder: **`pilot-run-deltas.json`**, **`first-value-report.md`**, **`first-value-report.pdf`**, **`sponsor-one-pager.pdf`** when endpoints succeed. Refuses Contoso demo runs unless **`--include-demo`**. Default output: **`./reference-evidence/<runId>/`**. **Alias:** `proof-pack`. |
| `reference-evidence --tenant <tenantId> [--out <dir>] [--include-demo]` | AdminAuthority | Downloads **`GET /v1/admin/tenants/{tenantId}/reference-evidence`** as **`reference-evidence-{tenantId}.zip`**. **Alias:** `proof-pack`. |

### Diagnose

| Command | Scope | Description |
|--------|-------|-------------|
| `doctor` / `check` | — | Readiness diagnostics: CLI build info, local `archlucid.json` (brief, writable outputs dir), API `GET /version` (build identity), then API `/health/live`, `/health/ready`, and `/health`. Exit 1 if readiness or combined `/health` is not 2xx. |
| `health` | — | Check API connectivity (`GET /health`). Exit **0** if OK; **3** if unreachable; **2** if the API base URL is invalid. With global `--json`, prints one JSON object per line (stderr on failure, stdout on success). |
| `run-support-packet <runId>` | ReadAuthority | Emit a paste-ready **support packet**: API base, status, request id, timestamps, manifest version (if committed), submitted-results count, OpenTelemetry trace id, simulator-substitution flag, one-line **`GET /version`** JSON, next-step hint, and canonical CLI/HTTP follow-ups. Honors leading **`--json`**. |
| `saml test-config` | — | **Offline** SAML 2.0 SP configuration validation from merged `appsettings` / env. Prints **Pass/Fail/Warn/Info** per component; does **not** run a SAML login. No API required. Honors global **`--json`**. Exit **4** when any component **Fail**s. |
| `support-bundle` | ReadAuthority | Writes a **pilot/support** folder (and optional **`--zip`**): **`README.txt`**, **`manifest.json`**, **`redaction-manifest.json`**, **`build.json`**, **`health.json`**, **`api-contract.json`**, **`config-summary.json`**, **`environment.json`**, **`workspace.json`**, **`references.json`**, **`logs.json`**. Review before external upload. Default folder `support-bundle-<utc-timestamp>Z`. Flags: `--output <dir>`, **`--zip`**. See [Developer troubleshooting](/help/developer-troubleshooting). |
| `trace <runId>` | ReadAuthority | Look up the persisted OpenTelemetry trace ID for the run and print the trace viewer URL (or open it in the default browser when **`ARCHLUCID_TRACE_OPEN_BROWSER`** is `1` / `true`). Set **`ARCHLUCID_TRACE_VIEWER_URL_TEMPLATE`** with a **`{traceId}`** placeholder to enable links. |
| `webhooks test` | — | POST a **sample CloudEvents-shaped JSON** probe to any HTTPS receiver (integration smoke). Optional `--secret` / `ARCHLUCID_WEBHOOK_TEST_SECRET` adds `X-ArchLucid-Webhook-Signature: sha256=…`. Exit **0** on HTTP 2xx, **4** on transport/HTTP failure, **1** on usage errors. |

### Admin

| Command | Scope | Description |
|--------|-------|-------------|
| `roi-bulletin --quarter <Q-YYYY> [--min-tenants <n>] [--out <file.md>] [--synthetic] [--explain]` | AdminAuthority | Draft of the **quarterly aggregate ROI bulletin** via **`GET /v1/admin/roi-bulletin-preview`**, **or** **`--synthetic`** local sample (no API). See **[archlucid roi-bulletin](#archlucid-roi-bulletin)** and [Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement). |

**Before sending a support bundle:** open every generated file once; confirm **`redaction-manifest.json`** shows **`status=PASS`**; put **correlation** (**`X-Correlation-ID`** / **`correlationId`**) and **run id** in the ticket text; never attach raw **`.env`** or Key Vault dumps; expect **LLM prompt bodies to be truncated** in **`logs.json`** by design; if you used **`--zip`**, unzip and re-scan for literals your policy forbids. See [Developer troubleshooting](/help/developer-troubleshooting).

---

## First-value onboarding (product CLI)

For hosted evaluation, start with:

- **`archlucid trial smoke`** — validates the public trial signup funnel against a hosted API. See **[archlucid trial smoke](#archlucid-trial-smoke)**.
- **`archlucid second-run <file>`** — runs your architecture brief through create → execute → commit on a configured API. See product onboarding docs for `SECOND_RUN.toml` examples.

Set **`ARCHLUCID_API_URL`** (or `apiUrl` in `archlucid.json`) before either command.

### Removed from product CLI (contributor / self-host only)

These commands are **not** dispatched by `archlucid` in the product CLI surface. Contributor docs and repo scripts may still reference them for local Docker/self-host workflows: `dev up`, `pilot up`, `try`, `seed`, `seed-demo-data`, `run --quick`, `demo export`, `init` (local host appsettings wizard), and `new --quickstart`.

---

## archlucid trial smoke

`archlucid trial smoke` is the **primary first-value smoke** for hosted SaaS: it proves the **public trial signup funnel** is healthy against a target API base URL without standing up Docker or SQL locally.

### What it does, in order

1. **`POST /v1/register`** — creates a fresh tenant from the supplied `--org` / `--email` (anonymous endpoint, rate-limited by the `registration` policy on the API). Forwards `--baseline-hours` / `--baseline-source` when supplied. Expects **201 Created** with a `tenantId` body.
2. **`GET /v1/tenant/trial-status`** — using the registration scope headers (`X-Tenant-Id`, `X-Workspace-Id`, `X-Project-Id`) returned by step 1. Expects **200 OK**, with `trialWelcomeRunId` populated by the bootstrap path.
3. **`GET /v1/pilots/runs/{trialWelcomeRunId}/pilot-run-deltas`** — confirms the seeded sample run is queryable for time-to-committed-manifest and findings counts. Skipped automatically when the trial-status response has no welcome run, or explicitly with **`--skip-pilot-run-deltas`**.

Each step prints **`PASS` / `FAIL`** with the underlying HTTP detail. Failures include a forensic hint pointing at the audit-event type to grep for in `dbo.AuditEvents` (for example `TrialSignupAttempted` / `TrialSignupFailed` for step 1).

### Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--org <name>` | — (required) | Organization name for the smoke tenant. Use a timestamped value so reruns do not collide on the org slug. |
| `--email <email>` | — (required) | Administrator email for the smoke tenant. Use an `*.invalid` domain for non-production to avoid sending real verification mail. |
| `--display-name <name>` | `Trial Smoke User` | Display name on the admin role assignment. |
| `--baseline-hours <n>` | (none) | When supplied, exercises the optional baseline review-cycle capture path on `POST /v1/register`. |
| `--baseline-source <text>` | (none) | Free-text provenance note for `--baseline-hours`. Requires `--baseline-hours`. |
| `--api-base-url <url>` | resolved from `archlucid.json` / `ARCHLUCID_API_URL` | Override the API base URL for this single invocation. |
| `--skip-pilot-run-deltas` | (off) | Stop after step 2. Useful when the target tenant has not committed a run yet. |

### Exit codes

- **0** Success — every step returned the expected status.
- **1** Usage error — missing `--org` / `--email`, invalid `--baseline-hours`, or unknown flag.
- **4** Operation failed — at least one step did not return the expected status (see PASS/FAIL output for the failing step).

### Local quick-start

> **Warning:** `trial smoke` calls **`POST /v1/register`** and **creates a new tenant** in the target environment. Use a disposable org name and an `*.invalid` email domain in non-production.

```bash
export ARCHLUCID_API_URL=https://<your-archlucid-host>
archlucid trial smoke \
  --org "TrialSmoke-$(date +%s)" \
  --email "trial-smoke@example.invalid" \
  --baseline-hours 16 \
  --baseline-source "team estimate"
```

PowerShell (Windows):

```powershell
$env:ARCHLUCID_API_URL = "https://<your-archlucid-host>"
archlucid trial smoke `
  --org "TrialSmoke-$([int][double]::Parse((Get-Date -UFormat %s)))" `
  --email "trial-smoke@example.invalid" `
  --baseline-hours 16
```

For machine-readable output (CI smoke gates) place the global `--json` flag **before** the subcommand:

```bash
archlucid --json trial smoke --org Acme --email ops@example.invalid
```

The companion **end-to-end runbook** for the funnel lives in [Developer troubleshooting](/help/developer-troubleshooting).

---

## archlucid roi-bulletin

`archlucid roi-bulletin` downloads an **internal Markdown draft** of the quarterly **aggregate** bulletin described in [Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement). It never emits per-tenant rows — only **N**, **mean**, **median (p50)**, and **p90** for tenants that supplied `BaselineReviewCycleHours` during the calendar quarter window.

### Synthetic sample (`--synthetic`)

Use **`--synthetic`** to print a **non-SQL** Markdown sample (fixed illustrative numbers, stamped per row). **No** `ARCHLUCID_API_KEY` and **no** API reachability are required. **`--explain`** adds a short provenance note.

### Prerequisites (SQL-backed draft only)

- **`ARCHLUCID_API_KEY`** set to a key with **AdminAuthority** (same pattern as `archlucid reference-evidence --tenant`).
- API reachable at `ARCHLUCID_API_URL` / `archlucid.json` `apiUrl`.

### Exit codes

- **0** — Preview succeeded; Markdown printed to stdout or written to **`--out`**.
- **1** — Usage error (missing `--quarter`, invalid `--min-tenants`, unknown flag) **or** API returned **400** because the sample size is below **`--min-tenants`** (by design — do not lower the gate in scripts without owner approval).
- **3** — API unreachable (`health` probe failed upstream of the GET).
- **4** — Authenticated call failed for other reasons (401/403/5xx).

### Example

```bash
export ARCHLUCID_API_URL=https://<your-archlucid-host>
export ARCHLUCID_API_KEY='<admin key>'
archlucid roi-bulletin --quarter Q1-2026 --min-tenants 5 --out ./roi-bulletin-Q1-2026-draft.md
```

Synthetic (local only):

```bash
archlucid roi-bulletin --quarter Q1-2026 --synthetic --explain --out ./roi-bulletin-Q1-2026-synthetic.md
```

---

## archlucid marketplace preflight

`archlucid marketplace preflight` runs **deterministic repository checks** aligned with [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publication-checklist-gtm): pricing tier naming consistency, presence of billing webhook routes in [`docs/BILLING.md`](BILLING.md), and that `ArchLucid.Api/appsettings.json` includes `Billing:AzureMarketplace:MarketplaceOfferId`. It does **not** validate Partner Center seller verification, tax, payout, or TLS — those remain owner checklist items.

### Usage

```bash
archlucid marketplace preflight
```

From outside the repo tree, pass the repository root:

```bash
archlucid marketplace preflight --repo C:\ArchLucid\ArchLucid
```

### Exit codes

- **0** — Every automated check **PASS**.
- **1** — Invalid invocation (`--repo` without value, unknown flags).
- **4** — At least one check **FAIL** (`CliExitCode.OperationFailed`).

---

## Shell completion

Install once per machine (examples):

```bash
# Bash — append to ~/.bashrc
archlucid completions bash >> ~/.bash_completion_archlucid
echo 'source ~/.bash_completion_archlucid' >> ~/.bashrc
```

```bash
# zsh — save under a path on your fpath or source directly
archlucid completions zsh > ~/.archlucid-completions.zsh
echo 'source ~/.archlucid-completions.zsh' >> ~/.zshrc
```

```powershell
# PowerShell — add to your profile
archlucid completions powershell | Out-File -Encoding utf8 $PROFILE.CurrentUserAllHosts -Append
```

---

## Comparisons

The CLI can search and replay persisted comparison records.

### List comparisons

```bash
archlucid comparisons list [filters]
```

Supported flags:

- `--type <end-to-end-replay|export-record-diff>`
- `--left-run <runId>`
- `--right-run <runId>`
- `--left-export <exportRecordId>`
- `--right-export <exportRecordId>`
- `--label <label>`
- `--tag <tag>` (single tag)
- `--tags <t1,t2,...>` (multi-tag match)
- `--cursor <cursor>` for keyset paging (API `cursor` query param). When omitted, the CLI still sends `cursor=` so the API uses the keyset path; pass a prior `nextCursor` to continue.
- `--sort-by <createdUtc|type|label|leftRunId|rightRunId>` (defaults to `createdUtc`)
- `--sort <asc|desc>` (defaults to `desc`, maps to API `sortDir`)
- `--skip <n>` and `--limit <n>` for paging (offset path is unused when `cursor` is present)
- `--json` to output machine-readable JSON
- `--table` to output an aligned table

Examples:

```bash
# Page through end-to-end comparisons
archlucid comparisons list --type end-to-end-replay --limit 20 --skip 0 --table
archlucid comparisons list --type end-to-end-replay --limit 20 --skip 20 --table

# Filter by tag and label
archlucid comparisons list --tags incident,urgent --label incident-42 --json
```

### Replay a comparison (export to file)

```bash
archlucid comparisons replay <comparisonRecordId> [options]
```

Options:

- `--format <markdown|html|docx|pdf>` (default `markdown`)
- `--mode <artifact|regenerate|verify>` (default `artifact`)
- `--profile <default|short|detailed|executive>` (end-to-end only)
- `--persist` to persist the replay as a new comparison record (prints `PersistedReplayRecordId` when returned)
- `--out <path>` to control output location:
  - directory → saves as server-provided filename in that directory
  - file path → saves exactly to that path
- `--force` to overwrite an existing output file

Examples:

```bash
# Replay as DOCX into a directory (creates the directory if missing)
archlucid comparisons replay <id> --format docx --out outputs --force

# Verify replay and persist the replayed record
archlucid comparisons replay <id> --mode verify --persist
```

### Batch replay (download ZIP)

```bash
archlucid comparisons replay-batch <id1,id2,...> [--format docx] [--out outputs] [--force]
```

### Summary

```bash
archlucid comparisons summary <comparisonRecordId> [--json]
```

### Drift analysis

```bash
archlucid comparisons drift <comparisonRecordId> [--json]
```

### Replay diagnostics

```bash
archlucid comparisons diagnostics [--limit 50] [--json|--table]
```

This endpoint requires the API permission claim `replay:diagnostics`.

## archlucid.json

Single source of truth for project configuration. Required for `run`, `status`, `trace`, `submit`, `commit`, `seed`, `artifacts`.

| Field | Description |
|-------|-------------|
| `schemaVersion` | Config schema version (e.g. `"1.0"`). Required. |
| `projectName` | Project name. Required. |
| `apiUrl` | Optional. Overrides default API base URL. |
| `inputs.brief` | Path to brief file (e.g. `"inputs/brief.md"`). Required; file must exist. |
| `outputs.localCacheDir` | Local cache directory for artifacts (e.g. `"outputs"`). Required. |
| `plugins.lockFile` | Optional. When set, the file must exist. When `plugins` is omitted, plugin lock validation is skipped. |
| `infra.terraform` | Optional. When omitted, Terraform is treated as disabled. If `enabled` is true, `path` must point to an existing directory. |
| `architecture` | Optional. `environment`, `cloudProvider`, `constraints`, `requiredCapabilities`, `assumptions`, `priorManifestVersion`. |

Example (minimal valid — no plugins / infra):

```json
{
  "schemaVersion": "1.0",
  "projectName": "MyApp",
  "inputs": { "brief": "inputs/brief.md" },
  "outputs": { "localCacheDir": "outputs" }
}
```

Example (with plugin lock and Terraform path, common for `archlucid new`):

```json
{
  "schemaVersion": "1.0",
  "projectName": "MyApp",
  "inputs": { "brief": "inputs/brief.md" },
  "outputs": { "localCacheDir": "outputs" },
  "plugins": { "lockFile": "plugins/plugin-lock.json" },
  "infra": { "terraform": { "enabled": false, "path": "infra/terraform" } }
}
```

---

## Proof-packet GTM guardrails (CI)

Warn-only scan for forbidden sales promises (see [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)):

```bash
python scripts/ci/check_proof_summary_promise_language.py path/to/proof-summary.md
```

Use `--enforce` to fail CI when a generated sponsor artifact contains forbidden phrases (negations such as "do not claim SOC 2 certified" are allowed).

---

## Environment

| Variable | Description |
|----------|-------------|
| `ARCHLUCID_API_URL` | API base URL when not set in `archlucid.json`. **No localhost default** — required for API commands when `apiUrl` is unset (example: `https://<your-archlucid-host>`). |

---

## Exit codes

| Code | Meaning |
|------|---------|
| **0** | Success. |
| **1** | Usage error: missing/invalid invocation or unknown top-level command. |
| **2** | Configuration error (invalid API base URL / resolution). |
| **3** | API unavailable: host unreachable or health probe failed. |
| **4** | Operation failed: HTTP/API error after connect, local validation, filesystem error, or readiness failure after connect (`doctor`). |

Automation can combine exit codes with leading **`--json`** for structured stderr lines: `{"ok":false,"exitCode":3,"error":"api_unreachable","message":"..."}`.

---

## REST integration starter fixtures

For HTTP automation against the documented buyer integration path (create → execute → commit → export → compare → ROI), see [API contracts](/help/api-contracts), [Developer troubleshooting](/help/developer-troubleshooting), and the sanitized starter fixtures in [`scripts/ci/data/v1_integration_starter_contracts.v1.json`](../../scripts/ci/data/v1_integration_starter_contracts.v1.json).
