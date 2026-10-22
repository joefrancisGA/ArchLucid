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

    [Fact]
    public void Materialize_and_enumerate_rg_contributor_reaches_storage_through_site_identity()
    {
        const string siteScope =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/pay-reconcile";
        const string identityArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.managedidentity/userassignedidentities/mi-pay-reconcile";
        const string identityPrincipalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        const string blobReaderRoleDefinitionId =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/2a2b9908-6ea1-4ae2-8e65-a410df84e7dd";

        AzureExtractorExtendedResourceRow site = new()
        {
            AzureResourceId = siteScope,
            ResourceType = "Microsoft.Web/sites",
            Name = "pay-reconcile",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["identity"] =
                    "{\"type\":\"UserAssigned\",\"userAssignedIdentities\":{\""
                    + identityArm
                    + "\":{\"principalId\":\""
                    + identityPrincipalId
                    + "\"}}}",
            },
        };
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
                [site, storage],
                [
                    ParseJson($$"""{"scope":"{{ResourceGroupScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}"""),
                    ParseJson($$"""{"scope":"{{StorageScope}}","principalId":"{{identityPrincipalId}}","roleDefinitionId":"{{blobReaderRoleDefinitionId}}"}"""),
                ],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        Guid identityRowId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    AzureResourceId = StorageScope,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = Guid.NewGuid(),
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = identityRowId,
                    AzureResourceId = identityArm,
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                    CloudResourceId = Guid.NewGuid(),
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    AzureResourceId = siteScope,
                    ResourceType = "Microsoft.Web/sites",
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = identityRowId,
                    PropertyKey = "principalId",
                    PropertyValue = identityPrincipalId,
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
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = identityPrincipalId,
                    Scope = StorageScope,
                    RoleDefinitionId = blobReaderRoleDefinitionId,
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
            candidate => candidate.Hops.Any(hop => hop.EdgeType == GraphEdgeTypes.CanControlCode));
        Assert.Contains(path.Hops, hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity);
        Assert.Equal(GraphEdgeTypes.CanRead, path.Hops[^1].EdgeType);
        Assert.Equal(ArmResourceIdNormalizer.Normalize(StorageScope), path.TerminalScopeNodeId);
    }

    [Fact]
    public void Materialize_contributor_on_site_without_identity_skips_code_control()
    {
        const string siteScope =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/pay-reconcile";

        AzureExtractorExtendedResourceRow site = new()
        {
            AzureResourceId = siteScope,
            ResourceType = "Microsoft.Web/sites",
            Name = "pay-reconcile",
        };

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [site],
                [ParseJson($$"""{"scope":"{{siteScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        Assert.DoesNotContain(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanControlCode);
    }

    private static JsonElement ParseJson(string json) =>
        JsonDocument.Parse(json).RootElement.Clone();
}
