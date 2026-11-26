using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzurePrivateFlowVerificationTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly AzurePrivateFlow Flow = new(
        Guid.NewGuid(), Guid.NewGuid(),
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic",
        "topic.privatelink.eventgrid.azure.net", "10.0.0.2", 50000, "10.0.0.4", 443, "TCP");

    [Theory]
    [InlineData("privatelink.eventgrid.azure.net", true)]
    [InlineData("eventgrid.azure.net", true)]
    [InlineData("link.eventgrid.azure.net", false)]
    [InlineData("other.example.net", false)]
    public void Forwarding_requires_domain_label_boundary(string suffix, bool supported)
    {
        var decision = AzurePrivateFlowVerification.EvaluateForwarding(
            Flow.Hostname, true, true, [new(suffix, true, ["10.0.0.10"])], ["10.0.0.10"]);
        Assert.Equal(supported ? AzurePrivateConnectivityCheck.Supported : AzurePrivateConnectivityCheck.Unknown, decision);
    }

    [Fact]
    public void More_specific_untrusted_forwarder_does_not_fall_back()
    {
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzurePrivateFlowVerification.EvaluateForwarding(
            Flow.Hostname, true, true,
            [new("eventgrid.azure.net", true, ["10.0.0.10"]), new("privatelink.eventgrid.azure.net", true, ["10.0.0.11"])],
            ["10.0.0.10"]));
    }

    [Theory]
    [InlineData(-6, true, false)]
    [InlineData(-5, true, true)]
    [InlineData(0, true, true)]
    [InlineData(1, true, false)]
    [InlineData(0, false, false)]
    public void Measurement_requires_success_and_freshness(int minutes, bool success, bool expected)
    {
        Assert.Equal(expected, AzurePrivateFlowVerification.MatchesSuccessfulMeasurement(
            Flow, new(Flow, Now.AddMinutes(minutes), success), Now, TimeSpan.FromMinutes(5)));
    }

    [Fact]
    public void Measurement_cannot_cross_flow_boundaries()
    {
        AzurePrivateFlow[] unrelated =
        [
            Flow with { TenantId = Guid.NewGuid() }, Flow with { SnapshotId = Guid.NewGuid() },
            Flow with { SourceArmId = Flow.SourceArmId + "2" }, Flow with { EndpointArmId = Flow.EndpointArmId + "2" },
            Flow with { TargetArmId = Flow.TargetArmId + "2" }, Flow with { Hostname = "other.example.net" },
            Flow with { SourceIp = "10.0.0.3" }, Flow with { DestinationIp = "10.0.0.5" },
            Flow with { SourcePort = 50001 }, Flow with { DestinationPort = 444 }, Flow with { Protocol = "UDP" },
        ];
        foreach (var other in unrelated)
            Assert.False(AzurePrivateFlowVerification.MatchesSuccessfulMeasurement(
                Flow, new(other, Now, true), Now, TimeSpan.FromMinutes(5)));
    }

    [Theory]
    [InlineData("10.0.0.0/24", "Deny", AzurePrivateConnectivityCheck.Blocked)]
    [InlineData("VirtualNetwork", "Deny", AzurePrivateConnectivityCheck.Unknown)]
    [InlineData("10.1.0.0/24", "Deny", AzurePrivateConnectivityCheck.Supported)]
    public void Higher_priority_nsg_rule_cannot_be_skipped(string prefix, string access, AzurePrivateConnectivityCheck expected)
    {
        var rules = new[] { Rule("200", "*", "Allow"), Rule("100", prefix, access) };
        Assert.Equal(expected, AzurePrivateFlowNsgEvaluator.Evaluate(
            rules, true, "Outbound", Flow.SourceIp, Flow.SourcePort, Flow.DestinationIp, Flow.DestinationPort, Flow.Protocol));
    }

    [Theory]
    [InlineData(false, false, AzurePrivateConnectivityState.ConfigurationSupported)]
    [InlineData(true, false, AzurePrivateConnectivityState.Verified)]
    [InlineData(false, true, AzurePrivateConnectivityState.Blocked)]
    [InlineData(true, true, AzurePrivateConnectivityState.Indeterminate)]
    public void Combined_verdict_distinguishes_configuration_measurement_and_denial(bool measured, bool deny, AzurePrivateConnectivityState expected)
    {
        var properties = new Dictionary<string, string>
        {
            ["privateLinkServiceConnections"] = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { properties = new { privateLinkServiceId = Flow.TargetArmId,
                    privateLinkServiceConnectionState = new { status = "Approved" } } },
            }),
        };
        var result = AzurePrivateFlowVerification.Evaluate(
            Flow, properties, [Flow.DestinationIp], [Flow.DestinationIp], false, true, null, null,
            [new() { AddressPrefix = "10.0.0.0/24", NextHopType = "VnetLocal" }], true,
            new Dictionary<string, AzureInventoryReachabilityResourceProperties>(),
            [new("Outbound", true, [Rule("100", "*", deny ? "Deny" : "Allow")])], true,
            measured ? new(Flow, Now, true) : null, Now, TimeSpan.FromMinutes(5));
        Assert.Equal(expected, result);
    }

    private static AzureInventoryNsgSecurityRule Rule(string priority, string prefix, string access) => new()
    {
        Priority = priority, Direction = "Outbound", Protocol = "TCP", Access = access,
        SourceAddressPrefix = prefix, DestinationAddressPrefix = "*",
        SourcePortRange = "*", DestinationPortRange = "443",
    };
}
