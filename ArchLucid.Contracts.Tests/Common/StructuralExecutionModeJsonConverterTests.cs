using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class StructuralExecutionModeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", StructuralExecutionMode.Real)]
    [InlineData("\"Fallback\"", StructuralExecutionMode.Fallback)]
    public void Read_maps_defined_values(string json, StructuralExecutionMode expected)
    {
        StructuralExecutionMode value = JsonSerializer.Deserialize<StructuralExecutionMode>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<StructuralExecutionMode>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown structural execution mode value*");
    }

    [Fact]
    public void ArchitectureRun_rejects_out_of_range_structural_execution_mode_ordinal()
    {
        const string json = """
                            {
                              "runId": "run-1",
                              "requestId": "req-1",
                              "structuralExecutionMode": 99
                            }
                            """;

        Action act = () => JsonSerializer.Deserialize<ArchitectureRun>(json, Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown structural execution mode value*");
    }
}
