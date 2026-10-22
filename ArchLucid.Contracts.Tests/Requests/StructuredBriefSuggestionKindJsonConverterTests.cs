using System.Text.Json;

using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class StructuredBriefSuggestionKindJsonConverterTests
{
    [Theory]
    [InlineData("\"Constraint\"", StructuredBriefSuggestionKind.Constraint)]
    [InlineData("0", StructuredBriefSuggestionKind.Constraint)]
    [InlineData("0.0", StructuredBriefSuggestionKind.Constraint)]
    [InlineData("\"RequiredCapability\"", StructuredBriefSuggestionKind.RequiredCapability)]
    [InlineData("2", StructuredBriefSuggestionKind.RequiredCapability)]
    public void Read_maps_defined_values(string json, StructuredBriefSuggestionKind expected)
    {
        StructuredBriefSuggestionKind value = JsonSerializer.Deserialize<StructuredBriefSuggestionKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<StructuredBriefSuggestionKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown structured brief suggestion kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<StructuredBriefSuggestionKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown structured brief suggestion kind value*");
    }
}
