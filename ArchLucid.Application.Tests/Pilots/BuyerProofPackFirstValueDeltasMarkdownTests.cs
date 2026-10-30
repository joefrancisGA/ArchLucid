using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackFirstValueDeltasMarkdownTests
{
    [Fact]
    public void Computed_deltas_table_when_committed_timestamp_present_wraps_inline_code()
    {
        DateTime committed = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = TimeSpan.FromHours(2),
                ManifestCommittedUtc = committed,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Time to committed manifest |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(committed.ToString("O", System.Globalization.CultureInfo.InvariantCulture));
        row.Should().Contain("(committed `");
    }

    [Fact]
    public void Elapsed_section_when_created_timestamp_present_wraps_inline_code()
    {
        DateTime created = new(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime committed = created.AddHours(2);
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendElapsedSection(
            sb,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = TimeSpan.FromHours(2),
                RunCreatedUtc = created,
                ManifestCommittedUtc = committed,
            });

        sb.ToString().Should().Contain($"Created: `{created:O}`");
    }

    [Fact]
    public void Findings_by_severity_table_when_severity_label_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                FindingsBySeverity = [new KeyValuePair<string, int>("Warn|ing", 2)],
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.StartsWith("| Warn", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Warn\\|ing | 2 |");
    }
}
