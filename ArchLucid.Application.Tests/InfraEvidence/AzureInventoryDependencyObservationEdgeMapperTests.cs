using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDependencyObservationEdgeMapperTests
{
    [Fact]
    public void MapObservations_emits_observed_sql_edge_when_principal_and_target_resolve()
    {
        const string principalId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        const string webApp =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/orders-api";
        const string sqlServer =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql";
        const string sqlDatabase =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql/databases/ArchLucid";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            CreateComputeResource(webApp, principalId),
            CreateSqlDatabase(sqlServer, sqlDatabase, "ArchLucid"),
        ];

        List<AzureInventoryDependencyObservationRow> rows =
        [
            new()
            {
                SourcePrincipalId = principalId,
                TargetHost = "prodsql.database.windows.net",
                TargetCatalog = "ArchLucid",
                ObservationKind = AzureInventoryDependencyObservationKinds.SqlDependency,
                OperationClass = AzureInventoryDependencyObservationOperationClass.Read,
                EventCount = 5,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> relationshipKeys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryDependencyObservationEdgeMapper.MapObservations(
            resources,
            rows,
            relationships,
            relationshipKeys,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(webApp));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(sqlDatabase));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.CanRead);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryObservedDependency);
        warnings.Should().BeEmpty();
    }

    [Fact]
    public void MapObservations_skips_managed_identity_sign_in_without_target()
    {
        List<AzureInventoryDependencyObservationRow> rows =
        [
            new()
            {
                SourcePrincipalId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                ObservationKind = AzureInventoryDependencyObservationKinds.ManagedIdentitySignIn,
                OperationClass = AzureInventoryDependencyObservationOperationClass.Unknown,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> relationshipKeys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryDependencyObservationEdgeMapper.MapObservations(
            [],
            rows,
            relationships,
            relationshipKeys,
            warnings);

        relationships.Should().BeEmpty();
        warnings.Should().Contain("observed-target-unresolved:managedIdentitySignIn");
    }

    private static AzureExtractorExtendedResourceRow CreateComputeResource(string armId, string principalId)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = armId,
            ResourceType = "Microsoft.Web/sites",
            Name = "orders-api",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["identity"] = $$"""{"principalId":"{{principalId}}"}""",
            },
        };
    }

    private static AzureExtractorExtendedResourceRow CreateSqlDatabase(
        string serverArmId,
        string databaseArmId,
        string databaseName)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = databaseArmId,
            ResourceType = "Microsoft.Sql/servers/databases",
            Name = databaseName,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["serverArmId"] = serverArmId,
            },
        };
    }
}
