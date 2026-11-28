using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Tests.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityEnumPresenceTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"status":2147483647}""")]
    [InlineData("""{"status":null}""")]
    [InlineData("""{"status":-1}""")]
    [InlineData("""{"status":"Active, Expired"}""")]
    public void Waiver_requires_explicit_declared_status(string json) =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<RiskExceptionRecord>(json, Options));

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"action":2147483647}""")]
    [InlineData("""{"action":null}""")]
    [InlineData("""{"action":-1}""")]
    [InlineData("""{"action":"Approve, Approve"}""")]
    public void Review_event_requires_explicit_declared_action(string json) =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<FindingReviewEventRecord>(json, Options));

    [Fact]
    public void Name_enabled_boundaries_keep_valid_names_without_accepting_composites()
    {
        JsonSerializerOptions names = new(Options)
        {
            Converters = { new ValidatedEnumJsonConverterFactory(new JsonStringEnumConverter()) },
        };
        Assert.Equal(RiskExceptionStatus.Active,
            JsonSerializer.Deserialize<RiskExceptionRecord>("""{"status":"Active"}""", names)!.Status);
        Assert.Equal(FindingReviewAction.Approve,
            JsonSerializer.Deserialize<FindingReviewEventRecord>("""{"action":"Approve"}""", names)!.Action);
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<RiskExceptionRecord>("""{"status":"Active, Expired"}""", names));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<FindingReviewEventRecord>("""{"action":"Approve, Approve"}""", names));
    }

    [Fact]
    public void Explicit_zero_keeps_existing_authority_wire_meaning()
    {
        Assert.Equal(RiskExceptionStatus.Active,
            JsonSerializer.Deserialize<RiskExceptionRecord>("""{"status":0}""", Options)!.Status);
        Assert.Equal(FindingReviewAction.Approve,
            JsonSerializer.Deserialize<FindingReviewEventRecord>("""{"action":0}""", Options)!.Action);
    }
}
