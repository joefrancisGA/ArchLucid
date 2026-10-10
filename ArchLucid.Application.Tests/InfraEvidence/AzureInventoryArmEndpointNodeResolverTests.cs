using ArchLucid.Application.InfraEvidence.Mermaid;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventoryArmEndpointNodeResolverTests
{
    private const string Parent = "/subscriptions/s/resourcegroups/rg/providers/microsoft.network/virtualnetworks/vnet";
    private const string Child = Parent + "/subnets/subnet";
    private const string Grandchild = Child + "/widgets/widget";

    [Theory]
    [InlineData("exact", "nearest", "root", "exact")]
    [InlineData("", "nearest", "root", "nearest")]
    [InlineData(" ", "nearest", "root", "nearest")]
    [InlineData(null, "nearest", "root", "nearest")]
    [InlineData(null, "", "root", "root")]
    [InlineData(null, null, "root", "root")]
    [InlineData(null, null, null, "")]
    public void Exact_then_nearest_nonblank_ancestor_wins(string? exact, string? nearest, string? root, string expected)
    {
        Dictionary<string, string> nodes = new(StringComparer.OrdinalIgnoreCase);
        if (exact is not null) nodes[Grandchild] = exact;
        if (nearest is not null) nodes[Child] = nearest;
        if (root is not null) nodes[Parent] = root;

        bool found = AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(nodes, Grandchild, out string actual);

        Assert.Equal(expected.Length > 0, found);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("not-an-arm-id")]
    public void Unmapped_input_returns_empty_output(string armId)
    {
        Assert.False(AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
            new Dictionary<string, string>(), armId, out string actual));
        Assert.Equal(string.Empty, actual);
    }

    [Fact]
    public void Related_nodes_keep_exact_and_descendants_without_ancestor_fallback()
    {
        Dictionary<string, string> nodes = new(StringComparer.OrdinalIgnoreCase)
        {
            [Parent] = "parent", [Child] = "child", [Grandchild] = "grandchild",
            [Child + "/widgets/alias"] = "grandchild",
        };

        Assert.Equal(new[] { "child", "grandchild" }, AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(nodes, Child));
    }
}
