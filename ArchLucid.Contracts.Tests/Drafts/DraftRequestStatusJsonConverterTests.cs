using System.Text.Json;

using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestStatusJsonConverterTests
{
    [Theory]
    [InlineData("\"Drafting\"", DraftRequestStatus.Drafting)]
    [InlineData("1", DraftRequestStatus.Admitted)]
    [InlineData("1.0", DraftRequestStatus.Admitted)]
    public void Read_maps_defined_values(string json, DraftRequestStatus expected)
    {
        DraftRequestStatus value = JsonSerializer.Deserialize<DraftRequestStatus>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DraftRequestStatus>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown draft request status value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<DraftRequestStatus>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown draft request status value*");
    }
}
