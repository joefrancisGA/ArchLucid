using ArchLucid.Application.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventorySnapshotFreshnessCopyTests
{
    [Fact]
    public void FormatStaleLine_uses_utc_date_from_contract_copy()
    {
        DateTime captured = new(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc);

        string line = ArchitectureInventorySnapshotFreshnessCopy.FormatStaleLine(captured);

        line.Should().Be("Bound snapshot captured 2026-07-18 — may not reflect current estate.");
    }

    [Fact]
    public void FormatCareerExportMarkdown_includes_freshness_section_when_stale()
    {
        DateTime now = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        DateTime captured = now.AddDays(-8);

        string markdown = ArchitectureInventorySnapshotFreshnessCopy.FormatCareerExportMarkdown(captured, now);

        markdown.Should().Contain(ArchitectureInventorySnapshotFreshnessCopy.CareerExportHeading);
        markdown.Should().Contain("2026-09-01");
        markdown.Should().Contain(ArchitectureInventorySnapshotFreshnessCopy.StaleLineSuffix);
    }

    [Fact]
    public void FormatCareerExportMarkdown_omits_section_when_fresh()
    {
        DateTime now = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);

        ArchitectureInventorySnapshotFreshnessCopy.FormatCareerExportMarkdown(now.AddDays(-1), now)
            .Should().BeEmpty();
    }
}
