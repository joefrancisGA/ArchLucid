using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Tests.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityEnumPresenceTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"status":2147483647}""")]
    public void Waiver_requires_explicit_declared_status(string json) =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<RiskExceptionRecord>(json, Options));

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"action":2147483647}""")]
    public void Review_event_requires_explicit_declared_action(string json) =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<FindingReviewEventRecord>(json, Options));

    [Fact]
    public void Explicit_zero_keeps_existing_authority_wire_meaning()
    {
        Assert.Equal(RiskExceptionStatus.Active,
            JsonSerializer.Deserialize<RiskExceptionRecord>("""{"status":0}""", Options)!.Status);
        Assert.Equal(FindingReviewAction.Approve,
            JsonSerializer.Deserialize<FindingReviewEventRecord>("""{"action":0}""", Options)!.Action);
    }
}
