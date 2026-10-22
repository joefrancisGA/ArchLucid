using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySqlDatabasePrincipalEdgeMapperTests
{
    [Fact]
    public void MapPrincipals_emits_one_may_access_edge_when_principal_name_matches_unique_container_app()
    {
        const string apiApp =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/ArchLucid";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = apiApp,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-api",
            },
            new()
            {
                AzureResourceId = databaseArmId,
                ResourceType = "Microsoft.Sql/servers/databases",
                Name = "ArchLucid",
            },
        ];

        List<AzureInventorySqlDatabasePrincipalRow> rows =
        [
            new()
            {
                DatabaseArmId = databaseArmId,
                PrincipalName = "archlucid-api",
                TypeDesc = "EXTERNAL_USER",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> relationshipKeys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventorySqlDatabasePrincipalEdgeMapper.MapPrincipals(
            resources,
            rows,
            relationships,
            relationshipKeys,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(apiApp));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseArmId));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.MayAccess);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventorySqlDatabasePrincipal);
        warnings.Should().BeEmpty();
    }

    [Fact]
    public void MapPrincipals_skips_edge_when_two_apps_share_principal_name()
    {
        const string apiApp =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";
        const string workerApp =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/ArchLucid";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = apiApp,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-api",
            },
            new()
            {
                AzureResourceId = workerApp,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-api",
            },
            new()
            {
                AzureResourceId = databaseArmId,
                ResourceType = "Microsoft.Sql/servers/databases",
                Name = "ArchLucid",
            },
        ];

        List<AzureInventorySqlDatabasePrincipalRow> rows =
        [
            new()
            {
                DatabaseArmId = databaseArmId,
                PrincipalName = "archlucid-api",
                TypeDesc = "EXTERNAL_USER",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> relationshipKeys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventorySqlDatabasePrincipalEdgeMapper.MapPrincipals(
            resources,
            rows,
            relationships,
            relationshipKeys,
            warnings);

        relationships.Should().BeEmpty();
        warnings.Should().ContainSingle(w => w.StartsWith("sql-principal-name-ambiguous:", StringComparison.Ordinal));
    }
}
