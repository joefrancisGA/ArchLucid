using System.Text.Json;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class PatchArchitectureRestrictToSharesRequestTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"confirmRestrict\":true}")]
    public void Deserialize_MissingRestrictionState_RejectsRequest(string json)
    {
        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<PatchArchitectureRestrictToSharesRequest>(json, Options));
    }

    [Theory]
    [InlineData("{\"restrictToShares\":false}", false)]
    [InlineData("{\"restrictToShares\":true,\"confirmRestrict\":true}", true)]
    public void Deserialize_ExplicitRestrictionState_PreservesChoice(string json, bool expected)
    {
        var request = JsonSerializer.Deserialize<PatchArchitectureRestrictToSharesRequest>(json, Options);
        Assert.NotNull(request);
        Assert.Equal(expected, request!.RestrictToShares);
    }
}
