# AZI-04 — Platform services

**Model:** GPT-5.6 Luna. Paste this file as the whole task. This is the last implementation prompt in the set. Do not start a follow-up that maps the rest of the zip.

**Repo:** `c:\ArchLucid`

**Wave:** Azure icon coverage (**AZI**). **Depends on:** AZI-03 accepted, or the owner explicitly skipping AZI-03 after AZI-01. Start from that branch.

## Goal

Platform resource types that this zip icons, and that a full resource-group diagram still draws as pictograms, draw the official mark. Types with no file in this zip stay on the category pictogram.

## Why

After AZI-01 through AZI-03, compute, data, and network products on the diagram have official icons. Log Analytics, Application Insights, managed identity, and the other services in the table still use category pictograms even though the zip contains their marks.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `docs/architecture/AZURE_ICON_COVERAGE_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`

## What to build

1. Branch `azi/04-platform-services` from the accepted previous AZI branch.
2. Copy only the SVGs named below out of `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip` into `Assets/AzureIcons/Svg/` under the short file name. Copy the bytes. Do not edit the artwork. Delete any temp extract. Do not stage the zip.
3. Add one manifest row per short file. Leave `kind` unset. If a listed zip path is missing, stop and report it. Do not substitute a nearby file.

| ARM type | Zip entry under `Azure_Public_Service_Icons/Icons/` | Short file | Service | Category |
|----------|------------------------------------------------------|------------|---------|----------|
| `Microsoft.OperationalInsights/workspaces` | `monitor/00009-icon-service-Log-Analytics-Workspaces.svg` | `log-analytics.svg` | Log Analytics Workspaces | compute |
| `Microsoft.Insights/components` | `monitor/00012-icon-service-Application-Insights.svg` | `application-insights.svg` | Application Insights | compute |
| `Microsoft.ManagedIdentity/userAssignedIdentities` | `identity/10227-icon-service-Managed-Identities.svg` | `managed-identity.svg` | Managed Identities | security |
| `Microsoft.RecoveryServices/vaults` | `management + governance/00017-icon-service-Recovery-Services-Vaults.svg` | `recovery-services-vault.svg` | Recovery Services Vaults | compute |
| `Microsoft.Automation/automationAccounts` | `management + governance/00022-icon-service-Automation-Accounts.svg` | `automation-account.svg` | Automation Accounts | compute |
| `Microsoft.Logic/workflows` | `integration/02631-icon-service-Logic-Apps.svg` | `logic-app.svg` | Logic Apps | compute |
| `Microsoft.ServiceBus/namespaces` | `integration/10836-icon-service-Azure-Service-Bus.svg` | `service-bus.svg` | Azure Service Bus | compute |
| `Microsoft.EventHub/namespaces` | `analytics/00039-icon-service-Event-Hubs.svg` | `event-hub.svg` | Event Hubs | compute |
| `Microsoft.ApiManagement/service` | `integration/10042-icon-service-API-Management-Services.svg` | `api-management.svg` | API Management Services | web |
| `Microsoft.Cdn/profiles` and `Microsoft.Network/frontDoors` | `networking/10073-icon-service-Front-Door-and-CDN-Profiles.svg` | `front-door.svg` | Front Door and CDN Profiles | networking |
| `Microsoft.AppConfiguration/configurationStores` | `integration/10219-icon-service-App-Configuration.svg` | `app-configuration.svg` | App Configuration | compute |
| `Microsoft.Search/searchServices` | `web/10044-icon-service-Cognitive-Search.svg` | `cognitive-search.svg` | Cognitive Search | compute |
| `Microsoft.Compute/availabilitySets` | `compute/10025-icon-service-Availability-Sets.svg` | `availability-set.svg` | Availability Sets | compute |
| `Microsoft.ContainerInstance/containerGroups` | `compute/10104-icon-service-Container-Instances.svg` | `container-instance.svg` | Container Instances | compute |
| `Microsoft.Web/certificates` | `web/00049-icon-service-App-Service-Certificates.svg` | `app-service-certificate.svg` | App Service Certificates | web |
| `Microsoft.SignalRService/SignalR` | `web/10052-icon-service-SignalR.svg` | `signalr.svg` | SignalR | web |

Use `identity/10227-icon-service-Managed-Identities.svg`, not `Entra-Managed-Identities.svg`.

4. Do not add rows for any other zip file. In particular, leave these unmapped:

- `Microsoft.App/containerApps` and `Microsoft.App/managedEnvironments`
- `Microsoft.Fabric/capacities`
- `Microsoft.PowerBIDedicated/capacities`
- `Microsoft.Network/privateDnsZones`
- Role assignments, locks, VM extensions, diagnostic setting child records, NSG security rules, and route entries
- Any type whose only similar file is a Hub, Classic, or portal-experience icon

5. Add a catalog resolve test for every ARM type in the table. Add one renderer test: a Log Analytics workspace emits `class="azure-icon"` and `data-file="Svg/log-analytics.svg"`. `Microsoft.App/containerApps` still resolves to null.
6. Do not change `Resolve`. Do not sweep the zip for further matches.

## Acceptance criteria

- Each ARM type in the table resolves to the service name in the table.
- `Microsoft.App/containerApps`, `Microsoft.Fabric/capacities`, and `Microsoft.Network/privateDnsZones` resolve to null.
- The ten original icons still resolve, including Storage Accounts with kind `StorageV2` and Function Apps with kind `functionapp,linux`, when AZI-01 is in this branch.
- Rendered SVG has no `data:image/png` and no `https://` image href.
- A network inventory fixture still contains `class="subscription-frame"`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not clone a GitHub icon mirror. Do not restore `*.png`.
- Do not embed the remainder of the zip.
- Do not change subscription-frame rules, data-flow placement, edge ink, or outline structure.
- Working-tree safety. Stage only the new SVGs, the manifest, and the tests. **No `git add -A`.** Do not stage the zip.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and look at a Log Analytics workspace, a managed identity, and a Container App if one is on the diagram. The first two should be official marks. The Container App should still be a category pictogram. List any ARM type still on a pictogram that you confirmed has no file in this zip. Wait for that look before any commit. Do not open another icon-mapping session unless the owner asks.
