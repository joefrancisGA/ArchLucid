# Azure Boards integration

Azure Boards is ArchLucid’s work-management connector for teams that track engineering work in Azure DevOps. It is independent of which cloud hosts your architecture — AWS and Google Cloud architectures can use Azure Boards for backlog and remediation tracking.

## When to use Azure Boards

Use this integration when your organization standardizes on Azure DevOps Boards for defects, tasks, or user stories and you want ArchLucid findings to open traceable work items with a link back to the review.

ArchLucid does **not** integrate with Azure Repos, Azure Pipelines, Azure Artifacts, or Azure Test Plans in this release.

## Required permissions

Create a personal access token (PAT) scoped to the selected Azure DevOps project with:

- **Read** access to work items and project metadata (to list projects and work item types)
- **Write** access to work items (to create items from findings)

> **Notice:** Grant only work-item read and write scopes for the target project. Do not grant code, pipeline, release, or organization-administration scopes unless your security policy requires broader tokens for unrelated workflows.

## Setup steps

1. Open [**Integrations → Azure Boards**](/integrations/azure-boards) (workspace administrator).
2. Enter your Azure DevOps organization URL (for example `https://dev.azure.com/your-organization`).
3. Save a **secure reference** to the PAT (Key Vault secret name).
4. Choose the default **project** and **work item type**. Types are loaded from your process template (Agile, Scrum, Basic, CMMI, or custom) — ArchLucid does not assume a universal “Bug” type.
5. Optionally set area path, iteration path, and default tags.
6. Run **Test connection** to confirm authentication and project access.
7. From a finding, use **Create Azure Boards work item** when connection validation succeeds.

> **Warning:** The PAT value is never shown again in ArchLucid after setup. Store the token only in your vault or secret store reference.

## Connection testing

The test performs read-only checks against Azure DevOps (organization access and project listing). It does **not** create a work item.

## Work item creation

When you create a work item from a finding, ArchLucid sends:

- A concise title and description derived from the finding
- Remediation guidance and non-sensitive evidence references
- A link back to the ArchLucid finding (respecting your workspace permissions)
- Severity mapped to Azure Boards priority when the process supports it
- Optional default tags from your connector settings

Duplicate creation per finding is blocked when a correlation already exists.

## Field mapping

| ArchLucid | Azure Boards |
|-----------|----------------|
| Finding severity (Critical/High/Medium/Low) | Priority field (1–4) when supported |
| Finding summary | Work item title |
| Finding rationale, recommended actions, evidence refs | Description (HTML) |
| Review / finding identifiers | Tags or description link |

Informational findings may be skipped when severity mapping does not apply.

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Setup incomplete | Organization URL, PAT reference, project, and work item type |
| Connection issue | PAT not expired, project still exists, token scopes |
| Create failed | Work item type removed from process, field validation on target project |
| Duplicate blocked | Open the existing linked work item from the finding panel |

## Known limitations in this release

- No inbound status synchronization from Azure Boards to ArchLucid
- No Azure Repos, Pipelines, or generic Azure resource integration
- No OAuth consent flow in UI — PAT via secure reference is the supported authentication method
- Project and work item type discovery requires a successful credential configuration

## Related

- [Integration readiness](/help/integration-readiness) — connector health and prerequisites
- [Findings](/help/findings) — how findings become remediation work
