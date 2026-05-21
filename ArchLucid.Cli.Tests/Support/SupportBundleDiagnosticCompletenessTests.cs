using ArchLucid.Cli.Support;
using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Support;

[Trait("Suite", "Support")]
public sealed class SupportBundleDiagnosticCompletenessTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Triage_catalog_lists_next_steps_and_health_files_first()
    {
        IReadOnlyList<SupportBundleTriageEntry> entries = SupportBundleTriageCatalog.Entries;

        entries.Count.Should().BeGreaterThan(4);
        entries[0].File.Should().Be(SupportBundleLayout.DiagnosticsSummaryFileName);
        entries[1].File.Should().Be(SupportBundleLayout.NextStepsFileName);
        entries[2].File.Should().Be(SupportBundleArchiveWriter.HealthFileName);
        foreach (SupportBundleTriageEntry entry in entries)
        {
            entry.File.Should().NotBeNullOrWhiteSpace();
            entry.Why.Should().NotBeNullOrWhiteSpace();
        }
    }
}
