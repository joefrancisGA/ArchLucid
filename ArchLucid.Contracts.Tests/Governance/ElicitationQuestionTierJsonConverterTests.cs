using System.Text.Json;

using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ElicitationQuestionTierJsonConverterTests
{
    [Theory]
    [InlineData("\"Must\"", ElicitationQuestionTier.Must)]
    [InlineData("1", ElicitationQuestionTier.Should)]
    [InlineData("1.0", ElicitationQuestionTier.Should)]
    public void Read_maps_defined_values(string json, ElicitationQuestionTier expected)
    {
        ElicitationQuestionTier value = JsonSerializer.Deserialize<ElicitationQuestionTier>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationQuestionTier>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation question tier value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationQuestionTier>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation question tier value*");
    }
}
