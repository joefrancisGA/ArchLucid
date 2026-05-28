> **Scope:** Collect buyer-safe evidence after the first successful commit on a staging or customer pilot tenant.

# First-pilot evidence bundle

**Audience:** Pilot operators, sales engineers, and founders preparing sponsor handoff.

**Last reviewed:** 2026-05-28

---

## When to run

After Phase C step **Commit** in [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) succeeds and before sending a sponsor packet or procurement follow-up.

## One-command proof pipeline

Use this before and after the first committed review. Without `-RunId`, the pipeline produces a readiness-only go/no-go report and records the missing run id as a **WARN**, not a blocking failure. After commit, pass `-RunId` to include the buyer-safe evidence bundle.

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl https://your-staging-api.example `
  -RunId <committed-run-guid> `
  -OutputDirectory artifacts/first-pilot-proof
```

The pipeline emits `go-no-go-summary.md`, `go-no-go-summary.json`, `preflight.json`, data-consistency readiness output, and the committed-run evidence bundle when `-RunId` is supplied. Triage IDs in the summary map to [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md).

## Committed-run evidence command

```powershell
./scripts/collect-first-pilot-evidence.ps1 `
  -BaseUrl https://your-staging-api.example `
  -RunId <committed-run-guid> `
  -OutputDirectory artifacts/first-pilot-evidence
```

Authentication uses `-BearerToken` / `-ApiKey` or env `ARCHLUCID_BEARER_TOKEN` / `ARCHLUCID_API_KEY` (same as other repo scripts).

## Output

Creates `artifacts/first-pilot-evidence/first-pilot-evidence-<UTC>/` containing:

| Artifact | Purpose |
| --- | --- |
| `run-metadata.json` | Collection stamp, run id, buyer-safe file list |
| `artifact-manifest.json` | SHA-256 checksums for tamper-evident handoff |
| `pilot-run-deltas.json` | Findings summary + proof-package completeness |
| `first-value-report.md` | Sponsor narrative with ROI basis labels |
| `audit-slice-metadata.json` | Recent audit event metadata (no raw payloads) |
| `run-detail-summary.json` | Run/manifest/findings surface |
| `pilot-observability-summary.json`, `pilot-observability-summary.md` | Buyer-safe health, version, OpenAPI, audit sample, manifest, LLM usage, and PilotStrict sponsor-evidence stamp |
| `health-*.json`, `version.json`, `openapi-v1.json` | Environment + contract stamp |
| `README.md` | What each file proves; buyer-safe vs internal-only |

## Email-sized variant

For a single ZIP attachment, use:

```powershell
dotnet run --project ArchLucid.Cli -- buyer-proof-pack <runId> --out proof.zip
```

## AI trust gates in the bundle

Treat `pilot-observability-summary.*` as the fast buyer-safe signal, not the full internal eval record. A committed sponsor handoff should show:

- `llmCallCountResolved=true` when the run is expected to include agent execution traces.
- `qualityGateDisposition=pilot-strict-sponsor-evidence-pass` for PilotStrict hosts.
- `rawPromptOrCompletionIncluded=false` and `secretsIncluded=false`.

If `qualityGateDisposition` is `pilot-strict-violates-sponsor-evidence` or `pilot-strict-signals-unresolved`, pause handoff and use [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](AGENT_QUALITY_STRICT_MODE_PILOT.md) plus [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) before sending the sponsor packet.

## Related

- Printable checklist: [`FIRST_RUN_EVIDENCE_CHECKLIST.md`](FIRST_RUN_EVIDENCE_CHECKLIST.md)
- Preflight before first run: `dotnet run --project ArchLucid.Cli -- --json pilot preflight`
- Demo go/no-go: `./scripts/verify-demo-workspace.ps1`
