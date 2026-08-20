using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class EvalCorpusFindingSeverityJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new EvalCorpusFindingSeverityJsonConverter() },
    };

    [Theory]
    [InlineData("\"High\"", FindingSeverity.Error)]
    [InlineData("\"medium\"", FindingSeverity.Warning)]
    [InlineData("2", FindingSeverity.Error)]
    public void Read_maps_legacy_labels_and_defined_ordinals(string json, FindingSeverity expected)
    {
        FindingSeverity value = JsonSerializer.Deserialize<FindingSeverity>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingSeverity>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding severity value*");
    }
}
