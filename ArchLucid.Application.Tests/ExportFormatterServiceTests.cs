using System.Globalization;

using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExportFormatterServiceTests
{
    [Fact]
    public void FormatIso8601Utc_emits_roundtrip_Z_for_utc_input()
    {
        ExportFormatterService sut = new();
        DateTime occurred = new(2026, 3, 15, 14, 30, 45, 123, DateTimeKind.Utc);

        string text = sut.FormatIso8601Utc(occurred);

        text.Should().Be("2026-03-15T14:30:45.1230000Z");
        DateTime parsed = DateTime.Parse(text, null, DateTimeStyles.RoundtripKind);
        parsed.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void BuildAuditExportCsvFileName_matches_segment_pattern()
    {
        ExportFormatterService sut = new();
        DateTime from = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        string name = sut.BuildAuditExportCsvFileName(from, to);

        name.Should().Be("audit-export-20260101T000000Z-20260102T000000Z.csv");
    }
}
