> **Scope:** V1 workflow handoff using existing ArchLucid artifacts only. No first-party Jira, ServiceNow, Confluence, Slack, Teams, or webhook connector is required or implied.

# V1 workflow handoff — GitHub and Azure DevOps

**Audience:** operators and architecture reviewers attaching ArchLucid proof artifacts to an existing PR, issue, architecture decision, or Azure DevOps work item.

## When to use this

Use this after a review is committed and the first-pilot evidence bundle exists. The goal is simple: attach the defensible architecture review package to the buyer's existing workflow without waiting for V1.1 connectors.

## 1. Collect the handoff artifacts

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl https://your-api.example `
  -RunId <committed-run-guid> `
  -OutputDirectory artifacts/first-pilot-proof
```

Minimum files to attach or link:

| Artifact | Why it belongs in the workflow item |
| --- | --- |
| `go-no-go-summary.md` | Send/hold status and triage card IDs |
| `first-value-report.md` | Sponsor narrative and ROI basis labels |
| `pilot-observability-summary.md` | Health/version/OpenAPI/LLM/PilotStrict stamp |
| `artifact-manifest.json` | SHA-256 checksum list for evidence integrity |
| Sponsor proof ZIP | One-file attachment when the workflow tool supports ZIP uploads |

Do not attach raw prompts, secrets, local `.env` files, or support bundles unless the downloader explicitly intended external support disclosure.

## 2. GitHub PR / issue comment template

```markdown
## ArchLucid architecture review handoff

- Review/run id: `<runId>`
- Manifest id: `<manifestId>`
- Evidence source: buyer evidence / accepted demo workspace
- Sponsor package: attached ZIP or secure-file link
- Quality gate: PilotStrict sponsor-evidence pass / documented caveat
- ROI basis: buyer-provided / defaulted / demo-derived / not collected

Attached:
- `go-no-go-summary.md`
- `first-value-report.md`
- `pilot-observability-summary.md`
- `artifact-manifest.json`

Deferred scope not required for this V1 handoff: Jira/ServiceNow/Confluence/Slack/Teams connectors, MCP, live marketplace checkout, SOC 2 CPA attestation, public reference customer.
```

## 3. Azure DevOps work item comment template

```markdown
ArchLucid review package attached.

Review/run id: `<runId>`
Manifest id: `<manifestId>`
Sponsor packet: `<secure-file-link-or-attachment-name>`
Send/hold status: see `go-no-go-summary.md`
Evidence integrity: see `artifact-manifest.json`
Operator next action: sponsor review / ARB Report / Evidence Pack / annual order-form handoff
```

## 4. Automation notes

- Use the OpenAPI contract and CLI outputs for automation; do not scrape the operator UI.
- Store large ZIPs in the buyer's approved secure file store and paste the link into GitHub/Azure DevOps if attachment limits are small.
- Keep the V1 handoff read-only. Workflow-state mutation, ticket synchronization, comment bots, and broad webhooks are V1.1 unless separately shipped.

## Related

- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`../library/API_CONTRACTS.md`](../library/API_CONTRACTS.md)
- [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md)
