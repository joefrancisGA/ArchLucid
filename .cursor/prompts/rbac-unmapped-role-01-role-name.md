# RUR-01 — Store the role name and translate roles the map already understands

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RUR-02 or RUR-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`

**Depends on:** `AzureInventoryRbacDataPlaneRoleMap.Resolve` and `AzureInventoryBuiltInRoleDefinitionNames` on master. The map already returns Read, Write, or ReadAndWrite for the display names listed below. The id dictionary does not.

## Goal

A role assignment whose display name is on the data-plane allowlist produces the same `CAN_READ` / `CAN_WRITE` edges whether the package stored the name or only the built-in role definition id. The resolved display name is stored on the snapshot role-assignment row. AcrPull and every other unlisted name still produce `rbac-role-unmapped` and no data-plane edge.

## Why

`Get-ArchLucidAzureRoleAssignmentCompanionRows` writes `scope`, `principalId`, `principalType`, `roleDefinitionId`, and `pimEligibilityKind`. `Get-AzRoleAssignment` already has `RoleDefinitionName`, including custom role names, and the row drops it. `AddRoleAssignmentEdges` then calls `TryResolveFromAssignment`, which reads `roleDefinitionName` or `roleName` and otherwise looks up eight built-in ids. Service Bus, Event Hubs, Storage Queue, Cognitive Services OpenAI User, and Search roles are on the allowlist by name, so a GUID-only package warns for them. Hosted collection sets `RoleName` only through that same eight-id dictionary. ARM role-assignment GET does not include the display name.

The persisted row (`AzureInventoryRoleAssignmentReadModel`) has no name, so a later session cannot show a custom role name. This session stores the name. It does not add a question.

Security: the name is a display string from the caller's existing role-assignment read. Do not grant, delete, or activate a role. Do not call Microsoft Graph or a role-definition GET.

Scalability: one optional string per assignment row that the cmdlet already returned. No per-assignment HTTP.

Reliability: a package that lacks `roleName` still materializes. Built-in ids in the dictionary resolve. An unknown id with no name stays unmapped.

Cost: no new Azure HTTP. Script `0.4.7` stays `0.4.7`. Both customer packages share the helper.

## Read first

- `ArchLucid.Core/InfraEvidence/AzureInventoryBuiltInRoleDefinitionNames.cs`
- `ArchLucid.Core/InfraEvidence/AzureInventoryRbacDataPlaneRoleMap.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (`AddRoleAssignmentEdges`)
- `ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs` (the `inventory.RoleAssignments` loop)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureRoleAssignmentCompanionRows`, `Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath`)
- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` (`MapRoleAssignment`, `MapRoleEligibilitySchedule`)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Materialize.cs` (role-assignment INSERT)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Read.cs` (role-assignment SELECT)
- `ArchLucid.Persistence/Migrations/409_RoleAssignmentPimEligibilityKind.sql` and its rollback (the column pattern; the next number may not be 412)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1` (the `Get-AzRoleAssignment` test)

## What to build

1. In `AzureInventoryBuiltInRoleDefinitionNames.GuidToRoleName`, add the built-in role definition id for each display name below that is not already present. Copy each id from that role's page under [Azure built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles). Put the Learn URL in a comment on that entry. If the page does not show the id, stop. Do not invent an id.

   - Azure Service Bus Data Receiver
   - Azure Service Bus Data Sender
   - Azure Service Bus Data Owner
   - Azure Event Hubs Data Receiver
   - Azure Event Hubs Data Sender
   - Azure Event Hubs Data Owner
   - Storage Queue Data Message Sender
   - Storage Queue Data Message Processor
   - Storage Queue Data Contributor
   - Cognitive Services OpenAI User
   - Search Index Data Reader
   - Search Index Data Contributor
   - Search Service Contributor

   Leave the existing eight entries unchanged. Do not add AcrPull. `Resolve("AcrPull")` stays None, and a GUID-only AcrPull assignment stays unmapped.

2. In `Get-ArchLucidAzureRoleAssignmentCompanionRows`, set `roleName` from `$assignment.RoleDefinitionName` when that property is non-whitespace. Omit the key when the mock or the cmdlet has no name. Do not call Azure to resolve a missing name. Leave `Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath` without a name; the server dictionary covers the built-ins above. Do not bump `$scriptVersion` in `Get-ArchLucidAzurePackage.ps1` or `Get-SecureNowAzurePackage.ps1`.

3. Persist the resolved name. Add nullable `RoleDefinitionName NVARCHAR(256) NULL` on `dbo.AzureInventoryRoleAssignments` in the next unused migration prefix under `ArchLucid.Persistence/Migrations`, plus a matching file under `Migrations/Rollback`. `411` is the highest prefix as of 2026-10-12; `409` is already used twice, so look before choosing. Follow the `COL_LENGTH` guard in `409_RoleAssignmentPimEligibilityKind.sql`.

   Add `RoleDefinitionName` to `AzureInventoryRoleAssignmentWrite`, `AzureInventoryRoleAssignmentReadModel`, the INSERT, and the SELECT. Each new type stays in its existing file. In `AzureInventorySnapshotMaterializer`, set the column from `TryResolveFromAssignment` (JSON `roleName` or `roleDefinitionName`, then the id dictionary). Truncate to 256 characters. Store null when both are missing.

4. Do not change the `rbac-role-unmapped:` warning text in this session. An allowlisted role stops warning because `Resolve` returns Read, Write, or ReadAndWrite. A custom name that is not on the allowlist still warns, and its name is now on the row for RUR-02.

## Tests

1. Add `ArchLucid.Core.Tests/InfraEvidence/AzureInventoryBuiltInRoleDefinitionNamesTests.cs`. For each new id, `TryResolveFromRoleDefinitionId` returns that display name. `Resolve` on that name returns the permission already asserted in `AzureInventoryRbacDataPlaneRoleMapTests`. AcrPull's id is not in the dictionary.
2. Extend `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`: a `Get-AzRoleAssignment` stub with `RoleDefinitionName = 'Contoso Reader'` writes `roleName` `Contoso Reader`. A stub without that property still writes the existing fields and no empty `roleName`.
3. Extend `AzureInventorySecurityEdgeMaterializerTests`: JSON with `roleName` `Azure Service Bus Data Sender` and an id that is not in the dictionary emits `CAN_WRITE`, no `CAN_READ`, and no `rbac-role-unmapped`. The same role as a GUID-only id from step 1 does the same. `Contoso Reader` still warns and still emits `HAS_ROLE`.
4. Extend `GetOnlyHostedAzureArmReadClientTests` or the closest role-assignment fixture: a built-in id added in step 1 sets `RoleName` to that display name with no extra HTTP. An unknown id still has a null `RoleName`.

Do not add a live Azure test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile and run `dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryBuiltInRoleDefinitionNamesTests|FullyQualifiedName~AzureInventoryRbacDataPlaneRoleMapTests'`.
- Compile and run `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventorySecurityEdgeMaterializerTests'`.
- Run `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure. Do not add a role-definition GET.
- Do not bump `$scriptVersion`.
- Do not re-run RUR-02, RUR-03, SN-QQ, or AX-DE as greenfield.

## Done when

A new Tier 1 package stores `roleName` for a standing assignment whose cmdlet returned `RoleDefinitionName`. Rematerializing a GUID-only package draws the data-plane edge for every built-in id added in this session and still warns for an unknown id. The snapshot row keeps a custom display name. AcrPull still warns. Script `0.4.7` is unchanged.
