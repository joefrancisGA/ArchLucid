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
    public void TryResolveTargetArmId_resolves_blob_linked_service_when_host_uses_uppercase_domain()
    {
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = storageArmId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
        ];

        AzureInventoryAdfLinkedServiceRow linkedService = new()
        {
            FactoryResourceId = factoryArmId,
            LinkedServiceName = "BlobLs",
            TargetHost = "SA1.BLOB.CORE.WINDOWS.NET",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        Dictionary<string, string> visibleArmIds =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        bool resolved = AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
            linkedService,
            visibleArmIds,
            hostIndex,
            out string? targetArmId,
            out ProvenanceKind provenanceKind,
            out _);

        resolved.Should().BeTrue();
        targetArmId.Should().Be(ArmResourceIdNormalizer.Normalize(storageArmId));
        provenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
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
        hostIndex.Should().NotContainKey("sa1.privatelink.blob.core.windows.net");
        hostIndex.Should().NotContainKey("sa1.queue.core.windows.net");
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
    public void BuildHostIndex_maps_cognitive_services_and_search_hosts()
    {
        const string cognitiveArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/openai-dev";
        const string searchArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Search/searchServices/search-dev";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = cognitiveArmId,
                ResourceType = "Microsoft.CognitiveServices/accounts",
                Name = "openai-dev",
            },
            new()
            {
                AzureResourceId = searchArmId,
                ResourceType = "Microsoft.Search/searchServices",
                Name = "search-dev",
            },
        ];

        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().ContainKey("openai-dev.openai.azure.com");
        hostIndex["openai-dev.openai.azure.com"].Should().Be(ArmResourceIdNormalizer.Normalize(cognitiveArmId));
        hostIndex.Should().ContainKey("openai-dev.cognitiveservices.azure.com");
        hostIndex["openai-dev.cognitiveservices.azure.com"].Should().Be(ArmResourceIdNormalizer.Normalize(cognitiveArmId));
        hostIndex.Should().ContainKey("search-dev.search.windows.net");
        hostIndex["search-dev.search.windows.net"].Should().Be(ArmResourceIdNormalizer.Normalize(searchArmId));
    }

    [Fact]
    public void BuildHostIndex_maps_private_link_storage_and_key_vault_hosts()
    {
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string keyVaultArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = storageArmId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
            new()
            {
                AzureResourceId = keyVaultArmId,
                ResourceType = "Microsoft.KeyVault/vaults",
                Name = "kv1",
            },
        ];

        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        string normalizedStorageId = ArmResourceIdNormalizer.Normalize(storageArmId);
        string normalizedKeyVaultId = ArmResourceIdNormalizer.Normalize(keyVaultArmId);

        hostIndex.Should().ContainKey("sa1.queue.core.windows.net");
        hostIndex.Should().ContainKey("sa1.table.core.windows.net");
        hostIndex.Should().ContainKey("sa1.file.core.windows.net");
        hostIndex.Should().ContainKey("sa1.privatelink.blob.core.windows.net");
        hostIndex["sa1.privatelink.blob.core.windows.net"].Should().Be(normalizedStorageId);
        hostIndex["sa1.privatelink.queue.core.windows.net"].Should().Be(normalizedStorageId);
        hostIndex["kv1.vault.azure.net"].Should().Be(normalizedKeyVaultId);
        hostIndex["kv1.privatelink.vaultcore.azure.net"].Should().Be(normalizedKeyVaultId);
        hostIndex.Should().NotContainKey("kv1.privatelink.vault.azure.net");
    }

    [Fact]
    public void BuildHostIndex_maps_private_link_sql_catalog_key()
    {
        const string serverArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql/databases/archlucid";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = serverArmId,
                ResourceType = "Microsoft.Sql/servers",
                Name = "prodsql",
            },
            new()
            {
                AzureResourceId = databaseArmId,
                ResourceType = "Microsoft.Sql/servers/databases",
                Name = "archlucid",
            },
        ];

        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().ContainKey("prodsql.privatelink.database.windows.net");
        hostIndex["prodsql.privatelink.database.windows.net|archlucid"].Should().Be(
            ArmResourceIdNormalizer.Normalize(databaseArmId));
    }

    [Fact]
    public void BuildHostIndex_maps_managed_redis_azure_net_host_when_location_present()
    {
        const string redisArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Cache/redis/myaccount";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = redisArmId,
                ResourceType = "Microsoft.Cache/redis",
                Name = "myaccount",
                Location = "eastus",
            },
        ];

        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);

        hostIndex.Should().ContainKey("myaccount.redis.cache.windows.net");
        hostIndex.Should().ContainKey("myaccount.eastus.redis.azure.net");
        hostIndex.Should().ContainKey("myaccount.privatelink.eastus.redis.azure.net");
        hostIndex["myaccount.eastus.redis.azure.net"].Should().Be(ArmResourceIdNormalizer.Normalize(redisArmId));
    }

    [Fact]
    public void TryResolveTargetArmId_infers_redis_linked_service_from_managed_redis_hostname()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string redisArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Cache/redis/myaccount";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = redisArmId,
                ResourceType = "Microsoft.Cache/redis",
                Name = "myaccount",
                Location = "eastus",
            },
        ];

        Dictionary<string, string> visibleArmIds =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId = factoryArmId,
            LinkedServiceName = "RedisLinkedService",
            LinkedServiceType = "AzureRedisCache",
            TargetHost = "myaccount.eastus.redis.azure.net",
        };

        bool resolved = AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
            row,
            visibleArmIds,
            hostIndex,
            out string? targetArmId,
            out ProvenanceKind provenanceKind,
            out _);

        resolved.Should().BeTrue();
        targetArmId.Should().Be(ArmResourceIdNormalizer.Normalize(redisArmId));
        provenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
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

    [Fact]
    public void TryResolveTargetArmId_infers_mysql_linked_service_from_connection_string_host()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string mysqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforMySQL/flexibleServers/mysql-edw";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId = mysqlArmId,
                ResourceType = "Microsoft.DBforMySQL/flexibleServers",
                Name = "mysql-edw",
            },
        ];

        Dictionary<string, string> visibleArmIds =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId = factoryArmId,
            LinkedServiceName = "MySqlLinkedService",
            LinkedServiceType = "AzureMySql",
            TargetHost = "mysql-edw.mysql.database.azure.com",
        };

        bool resolved = AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
            row,
            visibleArmIds,
            hostIndex,
            out string? targetArmId,
            out ProvenanceKind provenanceKind,
            out _);

        resolved.Should().BeTrue();
        targetArmId.Should().Be(ArmResourceIdNormalizer.Normalize(mysqlArmId));
        provenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
    }

    [Fact]
    public void TryResolveTargetArmId_resolves_mysql_linked_service_when_host_uses_uppercase_domain()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string mysqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforMySQL/flexibleServers/mysql-edw";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new AzureExtractorExtendedResourceRow
            {
                AzureResourceId = mysqlArmId,
                ResourceType = "Microsoft.DBforMySQL/flexibleServers",
                Name = "mysql-edw",
            },
        ];

        Dictionary<string, string> visibleArmIds =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildVisibleArmIdSet(resources);
        Dictionary<string, string> hostIndex =
            AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId = factoryArmId,
            LinkedServiceName = "MySqlLinkedService",
            LinkedServiceType = "AzureMySql",
            TargetHost = "mysql-edw.MYSQL.DATABASE.AZURE.COM",
        };

        bool resolved = AzureInventoryAdfLinkedServiceTargetResolver.TryResolveTargetArmId(
            row,
            visibleArmIds,
            hostIndex,
            out string? targetArmId,
            out ProvenanceKind provenanceKind,
            out _);

        resolved.Should().BeTrue();
        targetArmId.Should().Be(ArmResourceIdNormalizer.Normalize(mysqlArmId));
        provenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
    }
}
