using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceTargetResolverTests
{
    [Fact]
    public void BuildHostIndex_maps_cosmos_account_documents_host()
    {
        List<AzureExtractorExtendedResourceRow> resources =
        [
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DocumentDB/databaseAccounts/cosmos1",
                ResourceType = "Microsoft.DocumentDB/databaseAccounts",
                Name = "cosmos1",
            },
        ];

        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().ContainKey("cosmos1.documents.azure.com");
        hostIndex["cosmos1.documents.azure.com"].Should().Be(
            ArmResourceIdNormalizer.Normalize(resources[0].AzureResourceId));
    }

    [Fact]
    public void BuildHostIndex_omits_ambiguous_storage_hosts()
    {
        List<AzureExtractorExtendedResourceRow> resources =
        [
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg2/providers/Microsoft.Storage/storageAccounts/sa1",
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
        ];

        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().NotContainKey("sa1.blob.core.windows.net");
    }

    [Fact]
    public void BuildHostIndex_maps_sql_database_catalog_key_and_container_app_fqdn()
    {
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql/databases/archlucid";
        const string containerAppArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = databaseArmId,
                ResourceType = "Microsoft.Sql/servers/databases",
                Name = "archlucid",
            },
            new()
            {
                AzureResourceId = containerAppArmId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-api",
                Properties = new Dictionary<string, string>
                {
                    ["configuration.ingress.fqdn"] = "archlucid-api.eastus2.azurecontainerapps.io",
                },
            },
        ];

        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().ContainKey("prodsql.database.windows.net|archlucid");
        hostIndex["prodsql.database.windows.net|archlucid"].Should().Be(
            ArmResourceIdNormalizer.Normalize(databaseArmId));
        hostIndex.Should().ContainKey("archlucid-api.eastus2.azurecontainerapps.io");
        hostIndex["archlucid-api.eastus2.azurecontainerapps.io"].Should().Be(
            ArmResourceIdNormalizer.Normalize(containerAppArmId));
    }

    [Fact]
    public void BuildHostIndex_omits_ambiguous_container_app_fqdn()
    {
        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1",
                ResourceType = "Microsoft.App/containerApps",
                Name = "app1",
                Properties = new Dictionary<string, string>
                {
                    ["configuration.ingress.fqdn"] = "shared.example.azurecontainerapps.io",
                },
            },
            new()
            {
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app2",
                ResourceType = "Microsoft.App/containerApps",
                Name = "app2",
                Properties = new Dictionary<string, string>
                {
                    ["configuration.ingress.fqdn"] = "shared.example.azurecontainerapps.io",
                },
            },
        ];

        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().NotContainKey("shared.example.azurecontainerapps.io");
    }

    [Fact]
    public void TryResolveTargetArmId_infers_cosmos_linked_service_from_unique_host()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string cosmosArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DocumentDB/databaseAccounts/cosmos1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId = cosmosArmId,
                ResourceType = "Microsoft.DocumentDB/databaseAccounts",
                Name = "cosmos1",
            },
        ];

        Dictionary<string, string> visibleArmIds =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId = factoryArmId,
            LinkedServiceName = "CosmosLinkedService",
            LinkedServiceType = "CosmosDb",
            TargetHost = "cosmos1.documents.azure.com",
        };

        bool resolved = AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
            row,
            visibleArmIds,
            hostIndex,
            out string? targetArmId,
            out ProvenanceKind provenanceKind,
            out string associationType);

        resolved.Should().BeTrue();
        targetArmId.Should().Be(ArmResourceIdNormalizer.Normalize(cosmosArmId));
        provenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
        associationType.Should().Be(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred);
    }
}
