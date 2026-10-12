# RUR-02 — One plain-language warning per untranslated role

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RUR-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`

**Depends on:** RUR-01. `TryResolveFromAssignment` can return a display name, and that name may be on the assignment JSON as `roleName`.

## Goal

Each distinct role definition that does not map to a data-plane edge becomes one completeness warning. The diagram banner states the display name when RUR-01 resolved one, states how many assignments used that role, and states that Has role was kept and that no can-read or can-write line was drawn. A stored warning from before this session still renders.

## Why

`AddRoleAssignmentEdges` appends `rbac-role-unmapped:{roleDefinitionId}` once per assignment. `AzureInventorySnapshotCompletenessWarningsJson.Serialize` then distincts exact strings, so fifty assignments of one role become one row with no count. `resolveInfraEvidenceCompletenessWarningPresentation` has no branch for this prefix, so the banner title is "Inventory completeness note" and the detail is the raw string. Readers treat that as a defect in the role. The certain fact is narrower: ArchLucid did not translate the role into a data-plane line.

Security: the warning does not say the role is unused and does not say it can be removed.

Scalability: one stored string per role definition id, not per assignment.

Reliability: a snapshot materialized before this change still shows a sentence. Silence is not introduced for untranslated roles.

Cost: no Azure HTTP. No script version bump.

## Read first

- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (`AddRoleAssignmentEdges`)
- `ArchLucid.Core/InfraEvidence/AzureInventorySnapshotCompletenessWarningsJson.cs`
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventorySecurityEdgeMaterializerTests.cs` (`Materialize_unknown_role_adds_warning_and_skips_derived_edges`)
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.ts`
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.test.ts`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner.tsx`

## What to build

1. In `AddRoleAssignmentEdges`, stop appending one warning per assignment. Count assignments whose `Resolve` result is `None`, keyed by trimmed role definition id with ordinal ignore case. After the assignment loop, append one warning per key:

   `rbac-role-unmapped:{count}:{roleDefinitionId}::{roleName}`

   `{count}` is a positive integer. `{roleDefinitionId}` is the trimmed id from the first assignment in that group. ARM ids contain no colons. Append `::{roleName}` only when the resolved name is non-whitespace. The name may contain colons; the parser keeps everything after the first `::` as the name.

   Reader, Contributor, Owner, and the other allowlisted names still emit no warning. AcrPull still emits one warning. `HAS_ROLE` is unchanged. Eligible and unknown PIM rows that are unmapped still count; they already skip derived edges.

2. In `resolveInfraEvidenceCompletenessWarningPresentation`, parse that prefix.

   - New form, with a name: title `Role not translated into a data-plane line`. Detail `{roleName} is assigned {count} times. Has role is recorded. No can-read or can-write line was drawn.` Use `1 time` when the count is 1.
   - New form, without a name: the same title. Detail `This role is assigned {count} times. Has role is recorded. No can-read or can-write line was drawn. Role definition {roleDefinitionId}.`
   - Legacy form `rbac-role-unmapped:{roleDefinitionId}` where the remainder starts with `/`: the same title. Detail `This role is assigned at least once. Has role is recorded. No can-read or can-write line was drawn. Role definition {roleDefinitionId}.`

   A count that is not a positive integer falls through to the legacy sentence. Do not drop the row.

3. Leave the banner chrome alone. The header count stays the number of distinct warning strings. Do not turn this row into a questionnaire item.

## Tests

1. Two assignments of `/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-000000000099` and one assignment of a second unknown id produce two warnings. The first ends with `:2:` and that id. Each still has one `HAS_ROLE` per assignment and no `CAN_READ` or `CAN_WRITE`.
2. The same unknown id with different casing produces one warning whose count is 2.
3. JSON `roleName` `Contoso Reader` on an unknown id produces a warning that contains `::Contoso Reader`.
4. The existing Reader fixture still has no `rbac-role-unmapped` warning.
5. Vitest for the three copy shapes above, plus a malformed count that still shows the legacy sentence. The banner test can keep using two generic warnings.

Do not add a live Azure test. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile and run `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventorySecurityEdgeMaterializerTests'`.
- From `archlucid-ui`, run `npx vitest run src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.test.ts src/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner.test.tsx`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not hide `rbac-scope-too-broad` or `app-settings-not-collected-hosted-get-only`.
- Do not re-run RUR-01 or RUR-03 as greenfield.

## Done when

Rematerializing a snapshot replaces repeated `rbac-role-unmapped:{id}` strings with one counted string per role definition id. The banner names the role when the name was stored and says that Has role remains and the data-plane line was not drawn. An older stored string still produces a sentence. Allowlisted roles still produce no warning.
