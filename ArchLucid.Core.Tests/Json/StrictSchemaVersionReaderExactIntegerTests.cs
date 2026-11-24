using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Core.Json;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Json;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StrictSchemaVersionReaderExactIntegerTests
{
    [Theory]
    [InlineData("1.00000000000000001")]
    [InlineData("0.99999999999999999")]
    [InlineData("1e-400")]
    [InlineData("2147483646.9999999999999999")]
    public void Fractional_values_do_not_become_schema_versions(string raw)
    {
        using JsonDocument document = JsonDocument.Parse(raw);
        StrictSchemaVersionReader.TryReadSchemaVersion(document.RootElement, out _).Should().BeFalse();
        StrictSchemaVersionReader.TryReadSchemaVersion(JsonNode.Parse(raw), out _).Should().BeFalse();
        StrictSchemaVersionReader.TryParseWholeNumberString(raw, out _).Should().BeFalse();
    }

    [Theory]
    [InlineData("1.000", 1)]
    [InlineData("100e-2", 1)]
    [InlineData("0.0001e4", 1)]
    [InlineData("2147483647.000", int.MaxValue)]
    [InlineData("0e-400", 0)]
    public void Mathematically_integral_decimal_values_still_parse(string raw, int expected)
    {
        using JsonDocument document = JsonDocument.Parse(raw);
        StrictSchemaVersionReader.TryReadSchemaVersion(document.RootElement, out int elementVersion).Should().BeTrue();
        elementVersion.Should().Be(expected);
        StrictSchemaVersionReader.TryReadSchemaVersion(JsonNode.Parse(raw), out int nodeVersion).Should().BeTrue();
        nodeVersion.Should().Be(expected);
        StrictSchemaVersionReader.TryParseWholeNumberString(raw, out int stringVersion).Should().BeTrue();
        stringVersion.Should().Be(expected);
    }
}
