using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunStatusJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", ArchitectureRunStatus.Created)]
    [InlineData("\"Committed\"", ArchitectureRunStatus.Committed)]
    public void Read_maps_defined_values(string json, ArchitectureRunStatus expected)
    {
        ArchitectureRunStatus value = JsonSerializer.Deserialize<ArchitectureRunStatus>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ArchitectureRunStatus>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown architecture run status value*");
    }

    [Fact]
    public void ArchitectureRun_rejects_out_of_range_status_ordinal()
    {
        const string json = """
                            {
                              "runId": "run-1",
                              "requestId": "req-1",
                              "status": 99
                            }
                            """;

        Action act = () => JsonSerializer.Deserialize<ArchitectureRun>(json, Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown architecture run status value*");
    }
}
