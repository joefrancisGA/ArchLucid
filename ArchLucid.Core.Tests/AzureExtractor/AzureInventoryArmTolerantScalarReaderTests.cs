using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryArmTolerantScalarReaderTests
{
    [Fact]
    public void TryReadBoolean_accepts_boolean_and_string_shapes()
    {
        using (JsonDocument booleanTrue = JsonDocument.Parse("true"))
        {
            AzureInventoryArmTolerantScalarReader.TryReadBoolean(booleanTrue.RootElement, out bool value).Should().BeTrue();
            value.Should().BeTrue();
        }

        using (JsonDocument stringTrue = JsonDocument.Parse("\"true\""))
        {
            AzureInventoryArmTolerantScalarReader.TryReadBoolean(stringTrue.RootElement, out bool value).Should().BeTrue();
            value.Should().BeTrue();
        }

        using (JsonDocument numericOne = JsonDocument.Parse("1"))
        {
            AzureInventoryArmTolerantScalarReader.TryReadBoolean(numericOne.RootElement, out bool value).Should().BeTrue();
            value.Should().BeTrue();
        }
    }

    [Fact]
    public void TryReadStringOrObjectScalar_reads_ipAddress_object_wrapper()
    {
        using JsonDocument document = JsonDocument.Parse("""{"ipAddress":"10.0.0.4"}""");

        AzureInventoryArmTolerantScalarReader.TryReadStringOrObjectScalar(document.RootElement)
            .Should()
            .Be("10.0.0.4");
    }

    [Fact]
    public void TryReadInt32_accepts_numeric_string()
    {
        using JsonDocument document = JsonDocument.Parse("\"8080\"");

        AzureInventoryArmTolerantScalarReader.TryReadInt32(document.RootElement, out int port).Should().BeTrue();
        port.Should().Be(8080);
    }

    [Theory]
    [InlineData("9007199254740993.0", 9007199254740993L)]
    [InlineData("\"9007199254740993.0\"", 9007199254740993L)]
    [InlineData("9223372036854775807.0", long.MaxValue)]
    public void TryReadInt64_preserves_whole_decimal_values(string json, long expected)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        AzureInventoryArmTolerantScalarReader.TryReadInt64(document.RootElement, out long value).Should().BeTrue();
        value.Should().Be(expected);
    }

    [Fact]
    public void TryReadInt32_rejects_fractional_port_close_to_integer()
    {
        using JsonDocument document = JsonDocument.Parse("8080.00000000000001");

        AzureInventoryArmTolerantScalarReader.TryReadInt32(document.RootElement, out _).Should().BeFalse();
    }
}
