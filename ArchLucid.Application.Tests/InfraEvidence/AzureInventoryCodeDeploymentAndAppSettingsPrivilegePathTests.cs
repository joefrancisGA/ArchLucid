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
public sealed class AzureInventoryCodeDeploymentAndAppSettingsPrivilegePathTests
{
    private const string PrincipalId = "aaaaaaaa-1111-1111-1111-111111111111";
    private const string VmPrincipalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string ResourceGroupScope = "/subscriptions/sub/resourceGroups/rg";
    private const string VmScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
    private const string StorageScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ContributorRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";
    private const string BlobReaderRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/2a2b9908-6ea1-4ae2-8e65-a410df84e7dd";
    private const string SqlServerName = "sql1";
    private const string SqlDatabaseName = "appdb";
    private const string SqlServerScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
    private const string SqlDatabaseScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/appdb";
    private const string SiteScope =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/pay-api";

    [Fact]
    public void Materialize_and_enumerate_vm_contributor_reaches_storage_through_run_command_identity()
    {
        AzureExtractorExtendedResourceRow vm = new()
        {
            AzureResourceId = VmScope,
            ResourceType = "Microsoft.Compute/virtualMachines",
            Name = "vm1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["identity"] =
                    "{\"type\":\"SystemAssigned\",\"principalId\":\""
                    + VmPrincipalId
                    + "\"}",
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
                [vm, storage],
                [
                    ParseJson($$"""{"scope":"{{ResourceGroupScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}"""),
                    ParseJson($$"""{"scope":"{{StorageScope}}","principalId":"{{VmPrincipalId}}","roleDefinitionId":"{{BlobReaderRoleDefinitionId}}"}"""),
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

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshotForVmPath(materialized, storage);
        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> paths = PrivilegePathEnumerator.Enumerate(graph, new());

        PrivilegePathCandidate path = Assert.Single(
            paths,
            candidate => candidate.Hops.Any(hop =>
                hop.EdgeType == GraphEdgeTypes.CanControlCode
                && hop.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryControlToDataConversion,
                    "vm-run-command")));

        Assert.Equal(GraphEdgeTypes.CanRead, path.Hops[^1].EdgeType);
    }

    [Fact]
    public void Materialize_and_enumerate_site_contributor_reaches_sql_through_app_settings_conversion()
    {
        const string sqlHost = "sql1.database.windows.net";

        AzureExtractorExtendedResourceRow site = new()
        {
            AzureResourceId = SiteScope,
            ResourceType = "Microsoft.Web/sites",
            Name = "pay-api",
        };
        AzureExtractorExtendedResourceRow sqlServer = new()
        {
            AzureResourceId = SqlServerScope,
            ResourceType = "Microsoft.Sql/servers",
            Name = SqlServerName,
        };
        AzureExtractorExtendedResourceRow sqlDatabase = new()
        {
            AzureResourceId = SqlDatabaseScope,
            ResourceType = "Microsoft.Sql/servers/databases",
            Name = SqlDatabaseName,
        };

        AzureInventorySecurityEdgeMaterializeResult materialized =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [site, sqlServer, sqlDatabase],
                [ParseJson($$"""{"scope":"{{SiteScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false,
                appSettingHosts:
                [
                    new AzureInventoryAppSettingHostRow
                    {
                        SiteResourceId = SiteScope,
                        SettingName = "ConnectionStrings__App",
                        Host = sqlHost,
                        Catalog = SqlDatabaseName,
                        CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    },
                ],
                appSettingHostsFilePresent: true);

        Assert.Contains(
            materialized.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanRead
                && relationship.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryControlToDataConversion,
                    "app-settings-connection-string"));

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    AzureResourceId = ArmResourceIdNormalizer.Normalize(SqlDatabaseScope),
                    ResourceType = "Microsoft.Sql/servers/databases",
                    CloudResourceId = Guid.NewGuid(),
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    AzureResourceId = ArmResourceIdNormalizer.Normalize(SiteScope),
                    ResourceType = "Microsoft.Web/sites",
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = PrincipalId,
                    Scope = SiteScope,
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
            candidate => candidate.Hops.Any(hop =>
                hop.EdgeType == GraphEdgeTypes.CanRead
                && hop.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryControlToDataConversion,
                    "app-settings-connection-string")));

        Assert.Equal(ArmResourceIdNormalizer.Normalize(SqlDatabaseScope), path.TerminalScopeNodeId);
    }

    [Fact]
    public void Materialize_skips_app_settings_conversion_for_key_vault_reference_rows()
    {
        AzureExtractorExtendedResourceRow site = new()
        {
            AzureResourceId = SiteScope,
            ResourceType = "Microsoft.Web/sites",
            Name = "pay-api",
        };

        AzureInventorySecurityEdgeMaterializeResult materialized =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [site],
                [ParseJson($$"""{"scope":"{{SiteScope}}","principalId":"{{PrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false,
                appSettingHosts:
                [
                    new AzureInventoryAppSettingHostRow
                    {
                        SiteResourceId = SiteScope,
                        SettingName = "SqlConnection",
                        KeyVaultHost = "kv1.vault.azure.net",
                        SecretName = "sql-connection",
                        CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    },
                ],
                appSettingHostsFilePresent: true);

        Assert.DoesNotContain(
            materialized.Relationships,
            relationship => relationship.InferenceSource?.Contains(
                "app-settings-connection-string",
                StringComparison.OrdinalIgnoreCase) == true);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshotForVmPath(
        AzureInventorySecurityEdgeMaterializeResult materialized,
        AzureExtractorExtendedResourceRow storage)
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
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    AzureResourceId = ArmResourceIdNormalizer.Normalize(VmScope),
                    ResourceType = "Microsoft.Compute/virtualMachines",
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
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = VmPrincipalId,
                    Scope = StorageScope,
                    RoleDefinitionId = BlobReaderRoleDefinitionId,
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
    }

    private static JsonElement ParseJson(string json) =>
        JsonDocument.Parse(json).RootElement;
}
