using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class CloudProviderJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", CloudProvider.Azure)]
    [InlineData("\"Aws\"", CloudProvider.Aws)]
    [InlineData("\"gcp\"", CloudProvider.Gcp)]
    public void Read_maps_defined_values(string json, CloudProvider expected)
    {
        CloudProvider value = JsonSerializer.Deserialize<CloudProvider>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<CloudProvider>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown cloud provider value*");
    }

    [Fact]
    public void ArchitectureRequest_rejects_out_of_range_cloud_provider_ordinal()
    {
        const string json = """
                            {
                              "requestId": "req-1",
                              "description": "Design a secure multi-tier web application with private endpoints.",
                              "systemName": "Payments",
                              "environment": "prod",
                              "cloudProvider": 99
                            }
                            """;

        Action act = () => JsonSerializer.Deserialize<ArchitectureRequest>(json, Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown cloud provider value*");
    }
}
