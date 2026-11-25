using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzurePrivateConnectivityEvidenceTests
{
    [Theory]
    [InlineData("10.0.0.4", "10.0.0.4", AzurePrivateConnectivityCheck.Supported)]
    [InlineData("10.0.0.4", "10.0.0.5", AzurePrivateConnectivityCheck.Blocked)]
    [InlineData("10.0.0.4", "invalid", AzurePrivateConnectivityCheck.Unknown)]
    [InlineData("invalid", "10.0.0.4", AzurePrivateConnectivityCheck.Unknown)]
    public void Dns_answers_must_match_endpoint_addresses(string expected, string answer, AzurePrivateConnectivityCheck result)
    {
        Assert.Equal(result, AzurePrivateConnectivityEvidence.MatchDnsAddresses([expected], [answer]));
    }

    [Fact]
    public void Mixed_dns_answers_do_not_establish_private_resolution()
    {
        Assert.Equal(AzurePrivateConnectivityCheck.Blocked,
            AzurePrivateConnectivityEvidence.MatchDnsAddresses(["10.0.0.4"], ["10.0.0.4", "10.0.0.5"]));
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown,
            AzurePrivateConnectivityEvidence.MatchDnsAddresses(["10.0.0.4"], []));
    }

    [Theory]
    [InlineData(AzurePrivateConnectivityCheck.Supported, false, AzurePrivateConnectivityState.ConfigurationSupported)]
    [InlineData(AzurePrivateConnectivityCheck.Supported, true, AzurePrivateConnectivityState.Verified)]
    [InlineData(AzurePrivateConnectivityCheck.Unknown, false, AzurePrivateConnectivityState.Indeterminate)]
    [InlineData(AzurePrivateConnectivityCheck.Unknown, true, AzurePrivateConnectivityState.Indeterminate)]
    [InlineData(AzurePrivateConnectivityCheck.Blocked, false, AzurePrivateConnectivityState.Blocked)]
    [InlineData(AzurePrivateConnectivityCheck.Blocked, true, AzurePrivateConnectivityState.Indeterminate)]
    public void Routing_evidence_and_measurement_remain_distinct(
        AzurePrivateConnectivityCheck routing, bool measured, AzurePrivateConnectivityState expected)
    {
        const AzurePrivateConnectivityCheck supported = AzurePrivateConnectivityCheck.Supported;
        Assert.Equal(expected, AzurePrivateConnectivityEvidence.Evaluate(
            supported, supported, supported, routing, supported, measured));
    }

    [Fact]
    public void Approval_of_unrelated_target_is_not_reused()
    {
        var properties = new Dictionary<string, string>
        {
            ["privateLinkServiceConnections"] = """
                [{"properties":{"privateLinkServiceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/other","privateLinkServiceConnectionState":{"status":"Approved"}}}]
                """,
        };
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzurePrivateConnectivityEvidence.ResolveApproval(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/target", properties));
    }

    [Fact]
    public void Conflicting_manual_and_automatic_approval_is_indeterminate()
    {
        const string target = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic";
        string Row(string status) => System.Text.Json.JsonSerializer.Serialize(new[]
        {
            new { properties = new { privateLinkServiceId = target, privateLinkServiceConnectionState = new { status } } },
        });
        var properties = new Dictionary<string, string>
        {
            ["privateLinkServiceConnections"] = Row("Approved"),
            ["manualPrivateLinkServiceConnections"] = Row("Rejected"),
        };
        Assert.Equal(AzurePrivateConnectivityCheck.Unknown, AzurePrivateConnectivityEvidence.ResolveApproval(target, properties));
    }
}
