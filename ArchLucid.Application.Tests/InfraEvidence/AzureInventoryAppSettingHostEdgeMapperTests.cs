using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAppSettingHostEdgeMapperTests
{
    [Fact]
    public void MapHosts_emits_hostname_inferred_target_for_unique_sql_host()
    {
        const string siteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string sqlId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = siteId,
                ResourceType = "Microsoft.Web/sites",
                Name = "app1",
            },
            new()
            {
                AzureResourceId = sqlId,
                ResourceType = "Microsoft.Sql/servers",
                Name = "prodsql",
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = siteId,
                SettingName = "SqlConnection",
                Host = "prodsql.database.windows.net",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(siteId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(sqlId));
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryHostnameInferredTarget);
        warnings.Should().Contain(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsSqlCatalogMissing);
    }

    [Fact]
    public void MapHosts_emits_database_target_when_catalog_matches_inventory()
    {
        const string siteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/worker";
        const string databaseId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql/databases/archlucid";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = siteId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "worker",
            },
            new()
            {
                AzureResourceId = databaseId,
                ResourceType = "Microsoft.Sql/servers/databases",
                Name = "archlucid",
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = siteId,
                SettingName = "ConnectionStrings__ArchLucid",
                Host = "prodsql.database.windows.net",
                Catalog = "archlucid",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
    }

    [Fact]
    public void MapHosts_emits_server_edge_and_template_warning_for_catalog_template()
    {
        const string siteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/worker";
        const string sqlId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = siteId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "worker",
            },
            new()
            {
                AzureResourceId = sqlId,
                ResourceType = "Microsoft.Sql/servers",
                Name = "prodsql",
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = siteId,
                SettingName = "ConnectionStrings__Tenant",
                Host = "prodsql.database.windows.net",
                WarningCode = AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(sqlId));
        warnings.Should().Contain(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate);
        warnings.Should().NotContain(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsSqlCatalogMissing);
    }

    [Fact]
    public void MapHosts_skips_master_catalog_target()
    {
        const string siteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/worker";
        const string sqlId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prodsql";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = siteId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "worker",
            },
            new()
            {
                AzureResourceId = sqlId,
                ResourceType = "Microsoft.Sql/servers",
                Name = "prodsql",
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = siteId,
                SettingName = "ConnectionStrings__Master",
                Host = "prodsql.database.windows.net",
                Catalog = "master",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().BeEmpty();
    }

    [Fact]
    public void MapHosts_emits_ui_to_api_edge_when_fqdn_matches_inventory()
    {
        const string uiId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-ui";
        const string apiId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = uiId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-ui",
            },
            new()
            {
                AzureResourceId = apiId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "archlucid-api",
                Properties = new Dictionary<string, string>
                {
                    ["configuration.ingress.fqdn"] = "archlucid-api.eastus2.azurecontainerapps.io",
                },
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = uiId,
                SettingName = "ARCHLUCID_API_BASE_URL",
                Host = "archlucid-api.eastus2.azurecontainerapps.io",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(uiId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(apiId));
    }

    [Fact]
    public void MapHosts_emits_key_vault_ref_when_vault_host_matches_inventory()
    {
        const string siteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string vaultId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/myvault";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = siteId,
                ResourceType = "Microsoft.Web/sites",
                Name = "app1",
            },
            new()
            {
                AzureResourceId = vaultId,
                ResourceType = "Microsoft.KeyVault/vaults",
                Name = "myvault",
            },
        ];

        List<AzureInventoryAppSettingHostRow> rows =
        [
            new()
            {
                SiteResourceId = siteId,
                SettingName = "SqlPassword",
                KeyVaultHost = "myvault.vault.azure.net",
                SecretName = "sql-password",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAppSettingHostEdgeMapper.MapHosts(resources, rows, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(vaultId));
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryAppKeyVaultRef);
    }
}
