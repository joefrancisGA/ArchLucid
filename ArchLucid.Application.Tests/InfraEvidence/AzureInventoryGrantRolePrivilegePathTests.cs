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
public sealed class AzureInventoryGrantRolePrivilegePathTests
{
    private const string AppId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private const string AppServicePrincipalId = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
    private const string GraphGrantorPrincipalId = "cccccccc-dddd-eeee-ffff-000000000001";
    private const string GlobalAdminPrincipalId = "dddddddd-eeee-ffff-0000-111111111111";
    private const string ResourceGroupScope = "/subscriptions/sub/resourceGroups/rg";
    private const string StorageScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ContributorRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";

    [Fact]
    public void Materialize_and_enumerate_role_management_reaches_storage_without_add_credential()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            AzureInventoryMicrosoftGraphWellKnown.RoleManagementReadWriteDirectoryAppRoleId,
            sharedKeyEnabled: true,
            directoryRoleAssignments: [],
            extraGraphAssignments: []);

        PrivilegePathCandidate path = AssertSingleStorageWritePath(materialized);

        Assert.Contains(
            path.Hops,
            hop => hop.EdgeType == GraphEdgeTypes.CanGrantRole
                && hop.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryGrantRole,
                    AzureInventoryGrantRoleInferenceQualifiers.GraphRoleManagementReadWriteDirectory));

        Assert.DoesNotContain(
            path.Hops,
            hop => hop.EdgeType == GraphEdgeTypes.CanAddCredential
                && hop.FromNodeId == AzureInventoryPrincipalNodeId.Format(GraphGrantorPrincipalId));
    }

    [Fact]
    public void Materialize_and_enumerate_app_role_assignment_self_grant_reaches_storage()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            AzureInventoryMicrosoftGraphWellKnown.AppRoleAssignmentReadWriteAllAppRoleId,
            sharedKeyEnabled: true,
            directoryRoleAssignments: [],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        PrivilegePathCandidate path = paths.First(candidate =>
            candidate.Hops.Count >= 4
            && candidate.Hops[0].EdgeType == GraphEdgeTypes.CanGrantRole
            && candidate.Hops[0].InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryGrantRole,
                AzureInventoryGrantRoleInferenceQualifiers.GraphAppRoleAssignmentReadWriteAll)
            && candidate.Hops[1].EdgeType == GraphEdgeTypes.CanAddCredential
            && candidate.Hops.Any(hop => hop.EdgeType == GraphEdgeTypes.HasRole)
            && candidate.Hops[^1].EdgeType == GraphEdgeTypes.CanWrite);

        PrivilegePathEdge firstHop = path.Hops[0];
        Assert.Equal(GraphEdgeTypes.CanGrantRole, firstHop.EdgeType);
        Assert.Equal(
            GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryGrantRole,
                AzureInventoryGrantRoleInferenceQualifiers.GraphAppRoleAssignmentReadWriteAll),
            firstHop.InferenceSource);
        Assert.Equal(
            AzureInventoryGraphAppRoleSelfGrantNodeId.Format(GraphGrantorPrincipalId),
            firstHop.ToNodeId);
    }

    [Fact]
    public void Materialize_and_enumerate_unrelated_graph_app_role_reaches_nothing()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            "00000000-0000-0000-0000-000000000099",
            sharedKeyEnabled: true,
            directoryRoleAssignments: [],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        Assert.DoesNotContain(
            paths,
            candidate => candidate.Hops.Any(hop => hop.EdgeType == GraphEdgeTypes.CanGrantRole));
    }

    [Fact]
    public void Materialize_and_enumerate_tenant_global_admin_elevates_to_storage()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            appRoleId: null,
            sharedKeyEnabled: true,
            directoryRoleAssignments:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = GlobalAdminPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator,
                    DirectoryScopeId = "/",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        PrivilegePathCandidate path = Assert.Single(
            paths,
            candidate => candidate.EffectiveRoleName == "Owner"
                && candidate.Hops.Count == 2
                && candidate.Hops[0].EdgeType == GraphEdgeTypes.CanGrantRole
                && candidate.Hops[0].InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryGrantRole,
                    AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation)
                && candidate.Hops[^1].EdgeType == GraphEdgeTypes.CanWrite);

        Assert.Equal(ArmResourceIdNormalizer.Normalize(StorageScope), path.TerminalScopeNodeId);
    }

    [Fact]
    public void Materialize_and_enumerate_administrative_unit_global_admin_does_not_elevate()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            appRoleId: null,
            sharedKeyEnabled: true,
            directoryRoleAssignments:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = GlobalAdminPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator,
                    DirectoryScopeId = "/administrativeUnits/au-1",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        Assert.DoesNotContain(
            paths,
            candidate => candidate.Hops.Any(hop =>
                hop.EdgeType == GraphEdgeTypes.CanGrantRole
                && hop.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryGrantRole,
                    AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation)));
    }

    [Fact]
    public void Materialize_and_enumerate_elevation_does_not_end_on_storage_when_shared_key_disabled()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            appRoleId: null,
            sharedKeyEnabled: false,
            directoryRoleAssignments:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = GlobalAdminPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator,
                    DirectoryScopeId = "/",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: false);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        Assert.DoesNotContain(
            paths,
            candidate => candidate.TerminalScopeNodeId == ArmResourceIdNormalizer.Normalize(StorageScope)
                && candidate.Hops[^1].EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);
    }

    [Fact]
    public void Materialize_and_enumerate_eligible_global_admin_emits_no_elevation_hop()
    {
        AzureInventorySecurityEdgeMaterializeResult materialized = MaterializeWithGraphRole(
            appRoleId: null,
            sharedKeyEnabled: true,
            directoryRoleAssignments:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = GlobalAdminPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator,
                    DirectoryScopeId = "/",
                    PimEligibilityKind = "eligible",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            extraGraphAssignments: []);

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        Assert.DoesNotContain(
            paths,
            candidate => candidate.Hops.Any(hop =>
                hop.EdgeType == GraphEdgeTypes.CanGrantRole
                && hop.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryGrantRole,
                    AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation)));
    }

    private static AzureInventorySecurityEdgeMaterializeResult MaterializeWithGraphRole(
        string? appRoleId,
        bool sharedKeyEnabled,
        IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow> directoryRoleAssignments,
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> extraGraphAssignments)
    {
        AzureExtractorExtendedResourceRow storage = new()
        {
            AzureResourceId = ArmResourceIdNormalizer.Normalize(StorageScope),
            ResourceType = "Microsoft.Storage/storageAccounts",
            Name = "sa1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [AzureInventoryStorageSharedKeyAccessResolver.AllowSharedKeyAccessPropertyKey] =
                    sharedKeyEnabled ? "true" : "false",
            },
        };

        List<AzureInventoryGraphAppRoleAssignmentRow> graphAssignments = [.. extraGraphAssignments];

        if (!string.IsNullOrWhiteSpace(appRoleId))
        {
            graphAssignments.Add(new AzureInventoryGraphAppRoleAssignmentRow
            {
                PrincipalId = GraphGrantorPrincipalId,
                AppRoleId = appRoleId,
                ResourceId = "graph-sp-resource",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            });
        }

        return AzureInventorySecurityEdgeMaterializer.Materialize(
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
            applicationOwners: [],
            applicationOwnersFilePresent: true,
            directoryRoleAssignments: directoryRoleAssignments,
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
            graphAppRoleAssignments: graphAssignments,
            graphAppRoleAssignmentsFilePresent: true);
    }

    private static PrivilegePathCandidate AssertSingleStorageWritePath(
        AzureInventorySecurityEdgeMaterializeResult materialized)
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(materialized, sharedKeyEnabled: true);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        PrivilegePathCandidate path = Assert.Single(
            paths,
            candidate => candidate.Hops.Any(hop =>
                    hop.EdgeType == GraphEdgeTypes.CanGrantRole
                    && hop.ToNodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
                && candidate.Hops[^1].EdgeType == GraphEdgeTypes.CanWrite
                && candidate.TerminalScopeNodeId == ArmResourceIdNormalizer.Normalize(StorageScope));

        return path;
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        AzureInventorySecurityEdgeMaterializeResult materialized,
        bool sharedKeyEnabled)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    AzureResourceId = ArmResourceIdNormalizer.Normalize(StorageScope),
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
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    PropertyKey = AzureInventoryStorageSharedKeyAccessResolver.AllowSharedKeyAccessPropertyKey,
                    PropertyValue = sharedKeyEnabled ? "true" : "false",
                },
            ],
        };
    }

    private static JsonElement ParseJson(string json) =>
        JsonDocument.Parse(json).RootElement;
}
