using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingEnforcementTierJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", FindingEnforcementTier.Advisory)]
    [InlineData("\"PolicyViolation\"", FindingEnforcementTier.PolicyViolation)]
    public void Read_maps_defined_values(string json, FindingEnforcementTier expected)
    {
        FindingEnforcementTier value = JsonSerializer.Deserialize<FindingEnforcementTier>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingEnforcementTier>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding enforcement tier value*");
    }
}
