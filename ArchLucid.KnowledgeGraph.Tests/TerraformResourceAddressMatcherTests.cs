using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TerraformResourceAddressMatcherTests
{
    [Fact]
    public void NodeMatchesTerraformResourceAddress_matches_declaration_node_by_type_and_name()
    {
        GraphNode node = new()
        {
            NodeId = "obj-pay-sql",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "pay_sql",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_mssql_server",
            },
        };

        TerraformResourceAddressMatcher.NodeMatchesTerraformResourceAddress(
                node,
                "azurerm_mssql_server.pay_sql")
            .Should().BeTrue();
    }

    [Fact]
    public void TryParse_rejects_non_terraform_candidates()
    {
        TerraformResourceAddressMatcher.TryParse("pay-sql", out _, out _).Should().BeFalse();
        TerraformResourceAddressMatcher.TryParse("azurerm_mssql_server", out _, out _).Should().BeFalse();
    }
}
