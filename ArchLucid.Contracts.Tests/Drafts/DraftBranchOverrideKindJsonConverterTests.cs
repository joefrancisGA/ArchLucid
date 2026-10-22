using System.Text.Json;

using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftBranchOverrideKindJsonConverterTests
{
    [Theory]
    [InlineData("\"QuestionAnswer\"", DraftBranchOverrideKind.QuestionAnswer)]
    [InlineData("1", DraftBranchOverrideKind.BusinessOutcome)]
    [InlineData("1.0", DraftBranchOverrideKind.BusinessOutcome)]
    public void Read_maps_defined_values(string json, DraftBranchOverrideKind expected)
    {
        DraftBranchOverrideKind value = JsonSerializer.Deserialize<DraftBranchOverrideKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DraftBranchOverrideKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown draft branch override kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DraftBranchOverrideKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown draft branch override kind value*");
    }
}
