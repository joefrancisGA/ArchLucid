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
    public void Computed_deltas_table_when_llm_count_zero_resolved_discloses_simulator_caveat()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
                LlmCallCount = 0,
                LlmCallCountResolved = true,
                AuditRowCountResolved = true,
                AuditRowCount = 1,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM calls for this run |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("zero may be valid when simulator substitution applies");
    }

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
            .Single(line => line.Contains("| `Warn", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| `Warn\\|ing` | 2 |");
    }

    [Fact]
    public void Findings_by_severity_table_when_severity_label_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                FindingsBySeverity = [new KeyValuePair<string, int>("Warn`ing", 1)],
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ``Warn", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| ``Warn`ing`` | 1 |");
    }

    [Fact]
    public void Findings_by_severity_section_when_top_finding_without_buckets_does_not_claim_no_unmuted_stored()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                FindingsBySeverity = [],
                TopFindingId = "f-1",
            });

        string md = sb.ToString();
        md.Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
        md.Should().NotContain("No unmuted findings were stored for this run.");
    }

    [Fact]
    public void Findings_by_severity_section_when_snapshot_attests_empty_uses_snapshot_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                FindingsCountsFromSnapshot = true,
                FindingsBySeverity = [],
            });

        sb.ToString().Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.SnapshotZeroUnmutedFindingsPlainLabel);
    }

    [Fact]
    public void Computed_deltas_table_when_findings_total_honesty_label_wraps_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                FindingsBySeverity = [],
                TopFindingId = "f-1",
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain($"`{PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel}`");
    }

    [Fact]
    public void Findings_by_severity_section_when_top_finding_and_muted_exclusions_prefers_not_attested_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                FindingsBySeverity = [],
                TopFindingId = "f-1",
                MutedFindingsExcludedCount = 3,
            });

        string md = sb.ToString();
        md.Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
        md.Should().NotContain("muted findings were excluded from severity counts");
    }
}
