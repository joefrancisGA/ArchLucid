# RUR-03 — Ask what one app does with one resource

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`

**Depends on:** RUR-01. `AzureInventoryRoleAssignmentReadModel.RoleDefinitionName` may be set. The questionnaire still works when it is null.

## Goal

When a managed identity on a compute resource in this snapshot holds a standing role that ArchLucid does not translate, and the assignment scope is another resource in this snapshot, ask what that compute does with that resource: read, write, or nothing. Read draws one HumanAssertion `CAN_READ`. Write draws one HumanAssertion `CAN_WRITE`. Nothing draws no line. No other principal, scope, or role becomes a question.

## Why

The warning in RUR-02 is certain: the data-plane line was not drawn. Whether this app uses that grant on this resource is not. Today's questionnaire (`InferenceQuestionnaireItemGenerator`) asks about hosts and a Container Apps pair. Confirm always merges `CONNECTS_TO`. That is the wrong edge for this answer. A question per role id, or a question that asks whether the role can be deleted, asks the reader to guess and copies an Entra access review.

Security: the answer is `HumanAssertion`. It does not change Azure RBAC. The panel copy must say the line is the operator's statement. Do not store `ObservedFact`.

Scalability: at most 10 questions from this rule, and only after the existing emitters, inside the shared cap of 50.

Reliability: a dismissed or confirmed row for the same compute, resource, and role stays deduped for this snapshot the way other questionnaire rows do. A new snapshot may ask again. Cross-snapshot memory stays in SN-QQ.

Cost: no Azure HTTP. No Activity Log, diagnostic setting, or Entra access review.

## Read first

- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/InferenceQuestionnaireItemGenerator.cs`
- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/OperatorInferredConnectionSnapshotMerger.cs`
- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/IOperatorInferredConnectionService.cs`
- `ArchLucid.Contracts/InfraEvidence/OperatorInferredConnectionContracts.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryComputeIdentityPrincipalIndex.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRbacAssignmentScopeClassifier.cs` (`IsBroadScope` is necessary and not sufficient: a resource-group id is broad; this session also requires the scope to equal one inventoried resource id)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AzureInventorySnapshotDetailReadModel.cs` (`AzureInventoryRoleAssignmentReadModel`)
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `ArchLucid.KnowledgeGraph/WellKnownGraph.cs` (`CanRead`, `CanWrite`)
- `archlucid-ui/src/components/infra-evidence/InferenceQuestionnairePanel.tsx`
- `ArchLucid.Application.Tests/InfraEvidence/InferenceQuestionnaireItemGeneratorTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/OperatorInferredConnectionSnapshotMergerTests.cs`

## What to build

1. Add rule name `Unmapped data-plane role` on `InferenceQuestionnaireItemGenerator`. Emit it after catalog, SQL catalog, unresolved host, and same-CAE items. Stop this rule at 10 accepted items. The shared `MaxItems` of 50 still applies.

   Emit only when all of these hold:

   - `PimEligibilityKind` is null, empty, or `standing`.
   - `PrincipalId` is a key in `AzureInventoryComputeIdentityPrincipalIndex.BuildPrincipalToComputeArmIds` for the snapshot resources.
   - The normalized scope equals one resource `AzureResourceId` in the snapshot. Do not use `TryResolveAttestedScope`. A subscription, resource group, or management group produces no question.
   - The role name is `RoleDefinitionName` when set, otherwise `TryResolveFromRoleDefinitionId`. `AzureInventoryRbacDataPlaneRoleMap.Resolve` returns `None`.
   - No `CAN_READ` or `CAN_WRITE` edge already runs from that compute id to that scope.

   One question per compute id, scope id, and role definition id. Two computes that share one identity become two questions. Question text: `What does {compute name} do with {resource name}: read, write, or nothing?` When the role name is non-whitespace, append ` The role is {role name}.` Names are the last ARM segment. Set `FromArmId` to the compute id and `ToArmId` to the scope. Do not set `ToHost`.

2. Add an optional answer on confirm, in its own enum file: `Read`, `Write`. Existing confirms omit it and still merge `CONNECTS_TO` through `OperatorConfirmedConnection`. For this rule, `Read` merges `CAN_READ` and `Write` merges `CAN_WRITE`, provenance `HumanAssertion`, inference source `inventory-operator-attested-data-plane` (add that constant). Do not also merge `CONNECTS_TO`. Nothing uses the existing dismiss path and merges no edge. Confirm of this rule without Read or Write fails with a validation message. Confirm of any other rule rejects a data-plane answer.

3. In `InferenceQuestionnairePanel`, when `ruleName` is `Unmapped data-plane role`, show buttons `Read`, `Write`, and `Nothing`. Other rules keep their current controls. Under the question, one sentence: `This records your statement on the diagram. It does not change the role assignment in Azure.`

4. Update the public confirm contract and the OpenAPI snapshot if that request type is on `GET /openapi/v1.json`. The new field stays optional.

5. Leave `rbac-role-unmapped` on the banner after an answer. The warning is about the role. The answer is about one app and one resource.

## Tests

Extend `InferenceQuestionnaireItemGeneratorTests` and `OperatorInferredConnectionSnapshotMergerTests`.

1. A standing assignment from a web app's managed identity to a storage account in the snapshot, with role name `Contoso Reader`, emits one question naming both resources and the role. Dismiss and confirm rows with the same from id, to id, and role do not emit a second question.
2. A user principal, an eligible PIM row, a subscription scope, and a resource-group scope emit no question from this rule.
3. An allowlisted Reader assignment emits no question from this rule.
4. The eleventh qualifying pair emits nothing from this rule. An unresolved-host item still emits when the shared list is under 50.
5. Confirm Read merges one `CAN_READ` HumanAssertion and no `CONNECTS_TO`. Confirm Write merges one `CAN_WRITE`. Dismiss merges nothing. A confirmed host question with no data-plane answer still merges `CONNECTS_TO`.

Add a Vitest that the unmapped-role rule renders `Read`, `Write`, and `Nothing`, and that another rule does not render those three labels.

Do not add a live Azure test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile and run `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InferenceQuestionnaireItemGeneratorTests|FullyQualifiedName~OperatorInferredConnectionSnapshotMergerTests'`.
- From `archlucid-ui`, run `npx vitest run src/components/infra-evidence/InferenceQuestionnairePanel.test.tsx`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure. Do not call Entra, Activity Log, or diagnostic settings.
- Do not ask whether a role can be deleted.
- Do not re-run SN-QQ or RUR-02 as greenfield.
- Each new class or enum is its own file.

## Done when

A managed identity on a resource in the snapshot, with an untranslated standing role on one other resource in the snapshot, produces one question. Read and write each add one HumanAssertion data-plane line. Nothing adds none. Users, groups, broad scopes, eligible assignments, and allowlisted roles produce no question from this rule. The completeness warning remains.
