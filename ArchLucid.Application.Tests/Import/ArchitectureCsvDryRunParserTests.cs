using ArchLucid.Application.Import;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Import;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureCsvDryRunParserTests
{
    [Fact]
    public void TryParseRows_parses_header_and_rows_case_insensitively()
    {
        const string csv =
            """
            ComponentName,Type,Description
            Orders API,Api,Handles order lifecycle
            orders-db,SqlAzure,Primary relational store
            """;

        bool ok = ArchitectureCsvDryRunParser.TryParseRows(csv, out List<ArchitectureCsvComponentRow> rows, out string? err);

        ok.Should().BeTrue();
        err.Should().BeNull();
        rows.Should().HaveCount(2);
        rows[0].ComponentName.Should().Be("Orders API");
        rows[0].TypeToken.Should().Be("Api");
        rows[1].ComponentName.Should().Be("orders-db");
    }

    [Theory]
    [InlineData("\n")]
    [InlineData("\r\n")]
    [InlineData("\r")]
    public void TryParseRows_reports_physical_line_number_after_blank_rows(string newline)
    {
        string csv = string.Join(
            newline, "", "ComponentName,Type,Description", "Orders,Api,Valid", " ", ",Queue,Missing name");

        bool ok = ArchitectureCsvDryRunParser.TryParseRows(csv, out _, out string? err);

        ok.Should().BeFalse();
        err.Should().Be("Row 5: ComponentName is required.");
    }

    [Fact]
    public void TryParseRows_requires_all_columns()
    {
        const string csv = "A,B\nx,y,z";

        bool ok = ArchitectureCsvDryRunParser.TryParseRows(csv, out _, out string? err);

        ok.Should().BeFalse();
        err.Should().Contain("ComponentName");
    }
}
