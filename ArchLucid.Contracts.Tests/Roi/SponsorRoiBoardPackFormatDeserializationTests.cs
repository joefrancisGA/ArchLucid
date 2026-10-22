using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiBoardPackFormatDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_format_throws()
    {
        const string json = """
            {
              "format": 99,
              "contentType": "text/markdown; charset=utf-8",
              "fileName": "pack.md"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<SponsorRoiBoardPackExportResult>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_format_throws()
    {
        const string json = """
            {
              "format": "99",
              "contentType": "text/markdown; charset=utf-8",
              "fileName": "pack.md"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<SponsorRoiBoardPackExportResult>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_format()
    {
        const string json = """
            {
              "format": 1,
              "contentType": "application/pdf",
              "fileName": "pack.pdf"
            }
            """;

        SponsorRoiBoardPackExportResult result =
            JsonSerializer.Deserialize<SponsorRoiBoardPackExportResult>(json, ContractJson.Default)!;

        result.Format.Should().Be(SponsorRoiBoardPackFormat.Pdf);
    }
}
