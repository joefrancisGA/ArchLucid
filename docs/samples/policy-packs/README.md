> **Scope:** Sample **`PolicyPackContentDocument`** JSON for pilots and procurement demos — not a certification artifact.

# Sample policy packs

These files match the persisted shape described in **`ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument`**: `complianceRuleIds`, `complianceRuleKeys`, `alertRuleIds`, `compositeAlertRuleIds`, `advisoryDefaults`, `metadata` (all **`metadata` / `advisoryDefaults` values are strings**).

| File | Intent |
|------|--------|
| [soc2-compliance-baseline.json](./soc2-compliance-baseline.json) | **Severity gate** (Warning+) via `governance.blockCommitMinimumSeverity`, plus checklist strings for classification / encryption citations / least-privilege wording. Selects logging, encryption, and access catalog rules (`saas-ctrl-001` … `003`). |
| [cloud-migration-readiness.json](./cloud-migration-readiness.json) | **Content-pattern checklist** metadata for cost bands, RTO/RPO mentions, and external-service enumeration; enables encryption, third-party, segmentation, and DR rules (`saas-ctrl-002`, `004`, `005`, `006`). |
| [architecture-review-governance.json](./architecture-review-governance.json) | **Critical-only blocking intent** for dry-run (`governance.blockCommitOnCritical`), **count threshold** and **recommendation specificity** expectations as documented metadata (not enforced by the pre-commit engine for counts). |

## Prerequisites

- **`complianceRuleKeys`** reference ids from the bundled SaaS vertical pack (`templates/policy-packs/saas/compliance-rules.json`). Ensure those rules are loaded in your tenant (demo vertical seed, or equivalent catalog import) before relying on compliance filtering.
- **Standard** commercial tier and **Administrator** role for mutating routes (**`POST /v1/policy-packs`**, publish, assign — see **`docs/library/API_CONTRACTS.md`**).

## Validate JSON shape (local)

From the repo root:

```bash
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- policy validate docs/samples/policy-packs/soc2-compliance-baseline.json
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- policy validate docs/samples/policy-packs/cloud-migration-readiness.json
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- policy validate docs/samples/policy-packs/architecture-review-governance.json
```

There is no separate JSON Schema file checked in; **`PolicyPackContentDocument`** deserialization (what the CLI exercises) is the contract.

## Import via API

1. **Create** the pack (stores draft version **`1.0.0`**):

   **`POST /v1/policy-packs`** with body **`CreatePolicyPackRequest`**: `name`, `description`, `packType` (e.g. **`ProjectCustom`**), and **`initialContentJson`** set to the **raw file text** of one sample JSON.

2. **Publish** the same document as version **`1.0.0`** (or bump SemVer if you revised content):

   **`POST /v1/policy-packs/{policyPackId}/publish`** with **`PublishPolicyPackVersionRequest`**: `version`, `contentJson`.

3. **Assign** scope:

   **`POST /v1/policy-packs/{policyPackId}/assign`** with **`AssignPolicyPackRequest`**: `version`, `scopeLevel`, optional `isPinned`.

4. **Pre-commit enforcement:** metadata keys such as **`governance.blockCommitOnCritical`** and **`governance.blockCommitMinimumSeverity`** are honored by **`POST /v1/governance/policy-packs/dry-run`** when previewing proposed JSON. **Live** commits consult **`PolicyPackAssignment.BlockCommitOnCritical`** / **`BlockCommitMinimumSeverity`** (see **`docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`**).

### PowerShell example (create)

```powershell
$initial = Get-Content -LiteralPath "docs/samples/policy-packs/soc2-compliance-baseline.json" -Raw
$body = @{
  name = "Sample — SOC 2 architecture baseline"
  description = "Demonstration pack; adjust keys and metadata for production."
  packType = "ProjectCustom"
  initialContentJson = $initial
} | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri "$env:BASE/v1/policy-packs" -Headers @{ Authorization = "Bearer $env:TOKEN" } -Body $body -ContentType "application/json"
```

Replace **`BASE`** and **`TOKEN`** with your environment values.

## Dry-run without persisting

`POST /v1/governance/policy-packs/dry-run` with **`PolicyPackGovernanceDryRunRequest`**: embed file contents in **`policyPackContentJson`**, pass **`targetRunId`** or **`targetManifestId`**, and optionally override **`blockCommitOnCritical`** / **`blockCommitMinimumSeverity`** (overrides win over pack metadata per server merge rules).

## Customize

- Swap **`complianceRuleKeys`** for ids your organization authors.
- Treat **`sample.*` metadata** as documentation hooks unless you wire automation to read them.
- Keep each pack under **50 rules** — these samples use **few catalog keys** plus metadata/advisory defaults only.
