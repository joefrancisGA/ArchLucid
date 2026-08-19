using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class ServiceTypeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new ServiceTypeJsonConverter() },
    };

    [Theory]
    [InlineData("\"Api\"", ServiceType.Api)]
    [InlineData("\"ui\"", ServiceType.Ui)]
    [InlineData("\"Web App\"", ServiceType.Ui)]
    [InlineData("\"SQL Database\"", ServiceType.DataService)]
    public void Read_maps_enum_and_aliases(string json, ServiceType expected)
    {
        ServiceType value = JsonSerializer.Deserialize<ServiceType>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ServiceType>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown service type value*");
    }
}
