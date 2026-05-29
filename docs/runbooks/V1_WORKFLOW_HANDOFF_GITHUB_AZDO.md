> **Scope:** V1 workflow handoff using existing ArchLucid artifacts only. No first-party Jira, ServiceNow, Confluence, Slack, Teams, CloudEvents subscriber, or MCP connector is required or implied.

# V1 workflow handoff — GitHub and Azure DevOps

**Audience:** operators and architecture reviewers attaching ArchLucid proof artifacts to an existing PR, issue, architecture decision, or Azure DevOps work item / pipeline summary.

## When to use this

Use this **after** a review is committed and the first-pilot evidence bundle exists. The goal is to attach the defensible architecture review package to the buyer's existing workflow **without** waiting for V1.1 connectors (Jira, ServiceNow, Confluence, Slack, Teams, CloudEvents, MCP).

**Canonical proof command (sponsor-grade):**

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl https://your-api.example `
  -RunId <committed-run-guid> `
  -SponsorHandoff `
  -ProductionLikeHostedPilot `
  -OutputDirectory artifacts/first-pilot-proof
```

Readiness-only (no `-RunId` yet): omit `-SponsorHandoff` and re-run after the first golden manifest is committed.

## 1. Collect the handoff artifacts

The proof folder name is `first-pilot-proof-<timestamp>/`. Attach or link from **`first-pilot-evidence/`** when `-RunId` was supplied.

### Minimum attach set (workflow comment)

| Artifact | Path (under proof folder) | Why it belongs in the workflow item |
| --- | --- | --- |
| Go/no-go summary | `go-no-go-summary.md` | Send/hold disposition, triage card IDs, blocking reasons |
| Command center | `first-pilot-command-center.md` | Single **NEXT ACTION** and phased READY/WARN/HOLD (prefer over scrolling the full findings table) |
| Trace chain summary | `committed-review-trace-chain-summary.md` | Evidence → manifest → audit compact chain when `-RunId` was supplied |
| First-value report | `first-pilot-evidence/first-value-report.md` | Sponsor narrative and ROI basis labels (**Demo-derived** must stay labeled) |
| Observability stamp | `pilot-observability-summary.md` | Health/version/OpenAPI/LLM/PilotStrict posture |
| Evidence integrity | `first-pilot-evidence/artifact-manifest.json` | SHA-256 checksum list |
| Sponsor proof ZIP | `first-pilot-evidence/sponsor-proof.zip` (when generated) | One-file attachment when the tool supports ZIP uploads |

### Sponsor-grade attach set (add when `-SponsorHandoff` was used)

| Artifact | Path | Purpose |
| --- | --- | --- |
| Machine-readable disposition | `go-no-go-summary.json` | `sponsorPacketDisposition`, `roiBasisStatus`, `deferredScopeReasons` |
| Workflow handoff comment | `v1-workflow-handoff-comment.md` | Paste-ready PR/issue comment with sponsor disposition and commercial next step |
| Environment rollup | `environment-reliability-rollup.md` | Coarse reliability HOLD aggregation for hosted pilots |
| Quote-to-proof index | `quote-to-proof-packet.md` | Sales-led handoff rows mapped from this proof run |
| Route/tier/nav parity | `route-tier-policy-nav-parity.md` | API-authoritative commercial boundary summary |
| Procurement deal-ready | `procurement-deal-ready-check.txt` | **Deal-ready disposition: PASS/HOLD** |
| Config lint (hosted) | `config-lint-production-like-hosted-pilot.md` | Production-like profile PASS/HOLD |
| Demo validation (demo-led) | `demo-workspace-validation.txt` | Demo workspace / preview essentials PASS/HOLD |

Do **not** attach raw prompts, secrets, local `.env` files, or support bundles unless the downloader explicitly intended external support disclosure.

### CLI helpers (extract fields for templates)

```powershell
# Run support packet (status, manifest version, next-step hint)
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- run-support-packet <runId> --api-base-url https://your-api.example

# First-value Markdown for attachment
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- first-value-report <runId> --save --api-base-url https://your-api.example

# Buyer-safe reference bundle (when sponsor circulation is intended)
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- reference-evidence <runId> --api-base-url https://your-api.example
```

Inspect run state before retrying execute/commit: `GET /v1/architecture/run/{runId}` — see [Authority vs coordinator integrator table](../library/API_CONTRACTS.md#architecture-run-authority-pipeline-vs-coordinator-execute--result--commit).

## 2. GitHub PR / issue comment template

See filled sample: [`fixtures/v1-workflow-handoff-github-comment.sample.md`](fixtures/v1-workflow-handoff-github-comment.sample.md).

```markdown
## ArchLucid architecture review handoff

- Review/run id: `<runId>`
- Manifest id: `<manifestId>` (from `GET /v1/architecture/run/{runId}` or support packet)
- Evidence source: buyer evidence / accepted demo workspace
- Sponsor disposition: `<SEND|HOLD|READINESS_ONLY>` (from `go-no-go-summary.json`)
- Quality gate: PilotStrict sponsor-evidence pass / documented caveat
- ROI basis: buyer-provided / defaulted / demo-derived / not collected

Attached:
- `go-no-go-summary.md`
- `first-pilot-evidence/first-value-report.md`
- `pilot-observability-summary.md`
- `first-pilot-evidence/artifact-manifest.json`

Deferred scope not required for this V1 handoff: Jira/ServiceNow/Confluence/Slack/Teams connectors, CloudEvents, MCP, live marketplace checkout, SOC 2 CPA attestation, public reference customer.
```

## 3. Azure DevOps work item / pipeline summary template

See filled sample: [`fixtures/v1-workflow-handoff-azdo-comment.sample.md`](fixtures/v1-workflow-handoff-azdo-comment.sample.md).

```markdown
ArchLucid review package attached.

Review/run id: `<runId>`
Manifest id: `<manifestId>`
Sponsor disposition: `<SEND|HOLD|READINESS_ONLY>`
Sponsor packet: `<secure-file-link-or-attachment-name>`
Evidence integrity: `first-pilot-evidence/artifact-manifest.json`
Operator next action: sponsor review / ARB Report / Evidence Pack / annual order-form handoff (see `quote-to-proof-packet.md`)
```

## 4. CI/CD automation (manifest delta)

For PR decoration without V1.1 ticket sync:

| Platform | Doc |
| --- | --- |
| GitHub Actions / PR comment | [`../integrations/GITHUB_ACTION_MANIFEST_DELTA.md`](../integrations/GITHUB_ACTION_MANIFEST_DELTA.md), [`../integrations/GITHUB_PR_MANIFEST_DELTA.md`](../integrations/GITHUB_PR_MANIFEST_DELTA.md) |
| Azure DevOps pipeline task | [`../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md`](../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) |
| Server-side ADO PR decoration | [`../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |

Use OpenAPI (`GET /openapi/v1.json`) and CLI outputs for automation; do not scrape the operator UI.

## 5. V1.1 boundary (do not imply these are required)

First-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Teams**, **CloudEvents** subscriber integrations, and **MCP** outbound are **V1.1** buyer-contract items — see [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md). V1 handoff uses **manual attach** or **GitHub/ADO manifest-delta** patterns only.

## Related

- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) (Phase D5)
- [`../go-to-market/QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md)
- [`../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`](../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`../library/API_CONTRACTS.md`](../library/API_CONTRACTS.md)
- [`../library/ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md)
