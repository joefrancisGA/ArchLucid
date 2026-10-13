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
public sealed class AzureInventoryControlToDataPrivilegePathTests
{
    private const string PrincipalId = "aaaaaaaa-1111-1111-1111-111111111111";
    private const string ResourceGroupScope = "/subscriptions/sub/resourceGroups/rg";
    private const string StorageScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ContributorRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";

    [Fact]
    public void Materialize_and_enumerate_rg_contributor_reaches_child_storage()
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
                [ParseJson($$"""{"scope":"{{ResourceGroupScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

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
                    PrincipalId = PrincipalId,
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

        PrivilegePathCandidate path = Assert.Single(paths);
        Assert.Equal(GraphEdgeTypes.CanWrite, path.Hops[^1].EdgeType);
        Assert.Equal(ArmResourceIdNormalizer.Normalize(StorageScope), path.TerminalScopeNodeId);
        Assert.Equal("Contributor", path.EffectiveRoleName);
    }

    private static JsonElement ParseJson(string json) =>
        JsonDocument.Parse(json).RootElement.Clone();
}
