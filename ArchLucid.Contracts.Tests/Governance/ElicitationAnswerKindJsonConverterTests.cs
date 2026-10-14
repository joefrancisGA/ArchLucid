using System.Text.Json;

using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ElicitationAnswerKindJsonConverterTests
{
    [Theory]
    [InlineData("\"Text\"", ElicitationAnswerKind.Text)]
    [InlineData("1", ElicitationAnswerKind.Bool)]
    [InlineData("1.0", ElicitationAnswerKind.Bool)]
    public void Read_maps_defined_values(string json, ElicitationAnswerKind expected)
    {
        ElicitationAnswerKind value = JsonSerializer.Deserialize<ElicitationAnswerKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationAnswerKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation answer kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ElicitationAnswerKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown elicitation answer kind value*");
    }
}
