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
}
