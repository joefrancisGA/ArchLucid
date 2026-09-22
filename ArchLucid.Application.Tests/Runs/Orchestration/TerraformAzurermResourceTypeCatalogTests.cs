using ArchLucid.Application.Runs.Orchestration;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TerraformAzurermResourceTypeCatalogTests
{
    [Fact]
    public void Vendored_catalog_is_the_pinned_azurerm_v5_6_0_list()
    {
        TerraformAzurermResourceTypeCatalog.Count.Should().Be(TerraformAzurermResourceTypeCatalog.ExpectedCount);
        TerraformAzurermResourceTypeCatalog.Slugs[0].Should().Be("aadb2c_directory");
        TerraformAzurermResourceTypeCatalog.Slugs[^1].Should().Be("workloads_sap_three_tier_virtual_instance");
        TerraformAzurermResourceTypeCatalog.Slugs.Should().OnlyHaveUniqueItems();
        TerraformAzurermResourceTypeCatalog.Slugs.Should().BeInAscendingOrder(StringComparer.Ordinal);
    }

    [Theory]
    [InlineData("azurerm_storage_account.main")]
    [InlineData("azurerm_firewall.main")]
    [InlineData("azurerm_lb.main")]
    [InlineData("azurerm_linux_virtual_machine.main")]
    [InlineData("azurerm_ai_foundry.main")]
    public void Catalog_source_ids_match_for_datastore_and_service(string sourceId)
    {
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId(sourceId).Should().BeTrue();
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformServiceSourceId(sourceId).Should().BeTrue();
    }

    [Theory]
    [InlineData("azurerm_fty.main")]
    [InlineData("azurerm_bbg.main")]
    [InlineData("azurerm_not_a_resource.main")]
    [InlineData("server")]
    [InlineData("")]
    [InlineData(null)]
    public void Non_catalog_source_ids_do_not_match(string? sourceId)
    {
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId(sourceId).Should().BeFalse();
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformServiceSourceId(sourceId).Should().BeFalse();
    }

    [Fact]
    public void Retired_aliases_match_only_as_a_whole_slug()
    {
        TerraformAzurermRetiredResourceAliases.Aliases.Should().NotBeEmpty();

        foreach (string slug in TerraformAzurermRetiredResourceAliases.Aliases)
        {
            string sourceId = "azurerm_" + slug + ".main";
            string longerSlug = "azurerm_" + slug + "_extra.main";

            TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId(sourceId).Should().BeTrue();
            TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformServiceSourceId(sourceId).Should().BeTrue();
            TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId(longerSlug).Should().BeFalse();
        }

        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformServiceSourceId("azuread_application.main").Should().BeTrue();
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId("azurerm_sql_server.main").Should().BeTrue();
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId("azurerm_mssql_server.main").Should().BeTrue();
        TopologyProposalTerraformSourceIdHeuristics.LooksLikeTerraformDatastoreSourceId("azurerm_sql_server_extra.main").Should().BeFalse();
    }
}
