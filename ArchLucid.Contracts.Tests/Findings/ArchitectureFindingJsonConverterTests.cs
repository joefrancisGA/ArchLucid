using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ArchitectureFindingJsonConverterTests
{
    [Fact]
    public void Deserialize_mapsDescriptionAndLegacyHighSeverity()
    {
        const string json = """
                            {
                              "severity": "High",
                              "category": "Compliance",
                              "description": "Private endpoints required."
                            }
                            """;

        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() }
        };

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Severity.Should().Be(FindingSeverity.Error);
        finding.Message.Should().Be("Private endpoints required.");
    }
}
