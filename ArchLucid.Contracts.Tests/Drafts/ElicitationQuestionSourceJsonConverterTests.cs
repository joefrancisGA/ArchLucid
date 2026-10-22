using System.Text.Json;

using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class ElicitationQuestionSourceJsonConverterTests
{
    [Theory]
    [InlineData("\"L0Universal\"", ElicitationQuestionSource.L0Universal)]
    [InlineData("1", ElicitationQuestionSource.L1PackExplicit)]
    [InlineData("1.0", ElicitationQuestionSource.L1PackExplicit)]
    public void Read_maps_defined_values(string json, ElicitationQuestionSource expected)
    {
        ElicitationQuestionSource value = JsonSerializer.Deserialize<ElicitationQuestionSource>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationQuestionSource>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation question source value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationQuestionSource>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation question source value*");
    }
}
