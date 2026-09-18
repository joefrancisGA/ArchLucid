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
