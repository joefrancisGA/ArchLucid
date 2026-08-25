using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingTreatmentJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", FindingTreatment.DemoteToChecklist)]
    [InlineData("\"Promote\"", FindingTreatment.Promote)]
    public void Read_maps_defined_values(string json, FindingTreatment expected)
    {
        FindingTreatment value = JsonSerializer.Deserialize<FindingTreatment>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingTreatment>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding treatment value*");
    }
}
