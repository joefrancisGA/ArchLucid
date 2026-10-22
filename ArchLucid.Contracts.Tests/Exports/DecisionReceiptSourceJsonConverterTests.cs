using System.Text.Json;

using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class DecisionReceiptSourceJsonConverterTests
{
    [Theory]
    [InlineData("\"DraftAdmission\"", DecisionReceiptSource.DraftAdmission)]
    [InlineData("0", DecisionReceiptSource.DraftAdmission)]
    [InlineData("0.0", DecisionReceiptSource.DraftAdmission)]
    [InlineData("\"CommittedRun\"", DecisionReceiptSource.CommittedRun)]
    [InlineData("1", DecisionReceiptSource.CommittedRun)]
    [InlineData("1.0", DecisionReceiptSource.CommittedRun)]
    public void Read_maps_defined_values(string json, DecisionReceiptSource expected)
    {
        DecisionReceiptSource value = JsonSerializer.Deserialize<DecisionReceiptSource>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DecisionReceiptSource>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown decision receipt source value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DecisionReceiptSource>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown decision receipt source value*");
    }
}
