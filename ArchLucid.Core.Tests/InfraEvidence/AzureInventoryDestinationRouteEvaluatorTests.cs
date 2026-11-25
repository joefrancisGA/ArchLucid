using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDestinationRouteEvaluatorTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Longest_prefix_wins_regardless_of_order(bool reverse)
    {
        AzureInventoryRouteTableRoute[] routes = [Route("0.0.0.0/0", "Internet"), Route("10.0.0.0/24", "VnetLocal"), Route("10.0.0.4/32", "None")];
        if (reverse) Array.Reverse(routes);
        Assert.Equal(AzurePrivateConnectivityCheck.Blocked, AzureInventoryDestinationRouteEvaluator.Evaluate(routes, "10.0.0.4", true, out var selected));
        Assert.Equal("10.0.0.4/32", selected?.AddressPrefix);
        Assert.Equal(AzurePrivateConnectivityCheck.Supported, AzureInventoryDestinationRouteEvaluator.Evaluate(routes, "10.0.0.5", true, out _));
    }

    [Theory]
    [InlineData("2001:db8::/33", "2001:db8:7fff::1", AzurePrivateConnectivityCheck.Supported)]
    [InlineData("2001:db8::/33", "2001:db8:8000::1", AzurePrivateConnectivityCheck.Unknown)]
    [InlineData("10.0.0.0/25", "10.0.0.127", AzurePrivateConnectivityCheck.Supported)]
    [InlineData("10.0.0.0/25", "10.0.0.128", AzurePrivateConnectivityCheck.Unknown)]
    public void Prefix_boundaries(string prefix, string destination, AzurePrivateConnectivityCheck expected)
    {
        Assert.Equal(expected, AzureInventoryDestinationRouteEvaluator.Evaluate([Route(prefix, "VnetLocal")], destination, true, out _));
    }

    [Fact]
    public void Conflicting_equal_prefixes_are_unknown()
    {
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzureInventoryDestinationRouteEvaluator.Evaluate(
            [Route("10.0.0.0/24", "VnetLocal"), Route("10.0.0.0/24", "None")], "10.0.0.4", true, out var selected));
        Assert.Null(selected);
    }

    [Fact]
    public void Malformed_evidence_clears_prior_selection()
    {
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzureInventoryDestinationRouteEvaluator.Evaluate(
            [Route("10.0.0.0/24", "VnetLocal"), Route("10.0.0.0/99", "None")], "10.0.0.4", true, out var selected));
        Assert.Null(selected);
    }

    [Fact]
    public void Incomplete_routes_cannot_prove_reachability()
    {
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzureInventoryDestinationRouteEvaluator.Evaluate(
            [Route("10.0.0.0/24", "VnetLocal")], "10.0.0.4", false, out var selected));
        Assert.Null(selected);
    }

    private static AzureInventoryRouteTableRoute Route(string prefix, string hop) => new() { AddressPrefix = prefix, NextHopType = hop };
}
