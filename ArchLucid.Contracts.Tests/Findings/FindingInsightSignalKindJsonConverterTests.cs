using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingInsightSignalKindJsonConverterTests
{
    [Theory]
    [InlineData("\"DidNotThinkOfThat\"", FindingInsightSignalKind.DidNotThinkOfThat)]
    [InlineData("1", FindingInsightSignalKind.Expected)]
    [InlineData("1.0", FindingInsightSignalKind.Expected)]
    public void Read_maps_defined_values(string json, FindingInsightSignalKind expected)
    {
        FindingInsightSignalKind value = JsonSerializer.Deserialize<FindingInsightSignalKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingInsightSignalKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding insight signal kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingInsightSignalKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding insight signal kind value*");
    }
}
