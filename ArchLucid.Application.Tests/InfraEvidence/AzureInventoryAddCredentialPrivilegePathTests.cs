using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAddCredentialPrivilegePathTests
{
    private const string OwnerPrincipalId = "11111111-1111-1111-1111-111111111111";
    private const string AppId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private const string AppServicePrincipalId = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
    private const string ResourceGroupScope = "/subscriptions/sub/resourceGroups/rg";
    private const string StorageScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ContributorRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";

    [Fact]
    public void Materialize_and_enumerate_owner_reaches_storage_through_app_contributor()
    {
        AzureExtractorExtendedResourceRow storage = new()
        {
            AzureResourceId = StorageScope,
            ResourceType = "Microsoft.Storage/storageAccounts",
            Name = "sa1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [AzureInventoryStorageSharedKeyAccessResolver.AllowSharedKeyAccessPropertyKey] = "true",
            },
        };

        AzureInventorySecurityEdgeMaterializeResult materialized =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [storage],
                [ParseJson($$"""{"scope":"{{ResourceGroupScope}}","principalId":"{{AppServicePrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: true,
                [],
                entraGroupMembershipsFilePresent: true,
                [],
                effectiveNetworkControlsFilePresent: true,
                applicationOwners:
                [
                    new AzureInventoryApplicationOwnerRow
                    {
                        AppObjectId = "app-obj-1",
                        AppId = AppId,
                        OwnerId = OwnerPrincipalId,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ],
                applicationOwnersFilePresent: true,
                directoryRoleAssignments: [],
                directoryRoleAssignmentsFilePresent: true,
                entraApplicationRegistrations:
                [
                    new AzureInventoryEntraApplicationRegistrationRow
                    {
                        AppObjectId = "app-obj-1",
                        AppId = AppId,
                        ServicePrincipalObjectId = AppServicePrincipalId,
                    },
                ],
                graphAppRoleAssignments: [],
                graphAppRoleAssignmentsFilePresent: true);

        Guid storageRowId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = storageRowId,
                    AzureResourceId = StorageScope,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = AppServicePrincipalId,
                    Scope = ResourceGroupScope,
                    RoleDefinitionId = ContributorRoleDefinitionId,
                },
            ],
            Relationships = materialized.Relationships
                .Select(relationship => new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = relationship.FromAzureResourceId,
                    ToAzureResourceId = relationship.ToAzureResourceId,
                    RelationshipType = relationship.RelationshipType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    InferenceSource = relationship.InferenceSource,
                })
                .ToList(),
        };

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        PrivilegePathCandidate path = Assert.Single(
            paths,
            candidate => candidate.Hops.Any(hop => hop.EdgeType == GraphEdgeTypes.CanAddCredential)
                && candidate.Hops[^1].EdgeType == GraphEdgeTypes.CanWrite);

        Assert.Equal(ArmResourceIdNormalizer.Normalize(StorageScope), path.TerminalScopeNodeId);
    }

    [Fact]
    public void Materialize_and_enumerate_owner_does_not_reach_storage_when_shared_key_disabled()
    {
        AzureExtractorExtendedResourceRow storage = new()
        {
            AzureResourceId = StorageScope,
            ResourceType = "Microsoft.Storage/storageAccounts",
            Name = "sa1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [AzureInventoryStorageSharedKeyAccessResolver.AllowSharedKeyAccessPropertyKey] = "false",
            },
        };

        AzureInventorySecurityEdgeMaterializeResult materialized =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [storage],
                [ParseJson($$"""{"scope":"{{ResourceGroupScope}}","principalId":"{{AppServicePrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: true,
                [],
                entraGroupMembershipsFilePresent: true,
                [],
                effectiveNetworkControlsFilePresent: true,
                applicationOwners:
                [
                    new AzureInventoryApplicationOwnerRow
                    {
                        AppObjectId = "app-obj-1",
                        AppId = AppId,
                        OwnerId = OwnerPrincipalId,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ],
                applicationOwnersFilePresent: true,
                directoryRoleAssignments: [],
                directoryRoleAssignmentsFilePresent: true,
                entraApplicationRegistrations:
                [
                    new AzureInventoryEntraApplicationRegistrationRow
                    {
                        AppObjectId = "app-obj-1",
                        AppId = AppId,
                        ServicePrincipalObjectId = AppServicePrincipalId,
                    },
                ],
                graphAppRoleAssignments: [],
                graphAppRoleAssignmentsFilePresent: true);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    AzureResourceId = StorageScope,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = AppServicePrincipalId,
                    Scope = ResourceGroupScope,
                    RoleDefinitionId = ContributorRoleDefinitionId,
                },
            ],
            Relationships = materialized.Relationships
                .Select(relationship => new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = relationship.FromAzureResourceId,
                    ToAzureResourceId = relationship.ToAzureResourceId,
                    RelationshipType = relationship.RelationshipType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    InferenceSource = relationship.InferenceSource,
                })
                .ToList(),
        };

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        Assert.DoesNotContain(
            paths,
            candidate => candidate.Hops[^1].EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);
    }

    private static JsonElement ParseJson(string json) => JsonDocument.Parse(json).RootElement;
}
