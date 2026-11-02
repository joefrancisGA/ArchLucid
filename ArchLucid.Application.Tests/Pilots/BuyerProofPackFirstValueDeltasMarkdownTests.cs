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
    public void Computed_deltas_and_elapsed_section_when_no_wall_clock_share_skip_prose()
    {
        PilotRunDeltas deltas = new()
        {
            TimeToCommittedManifest = null,
            FindingsBySeverity = [],
            LlmCallCountResolved = true,
            AuditRowCountResolved = true,
        };

        StringBuilder computed = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(computed, deltas);

        StringBuilder elapsed = new();
        FirstValueReportDeltasSectionFormatter.AppendElapsedSection(elapsed, deltas);

        string prose = PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain;
        computed.ToString().Should().Contain(prose);
        elapsed.ToString().Should().Contain(prose);
        computed.ToString().Should().NotContain("Time to committed manifest was not stored.");
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

    [Fact]
    public void Findings_by_severity_section_when_muted_only_uses_same_copy_as_findings_total()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [],
            MutedFindingsExcludedCount = 1,
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(sb, deltas);

        sb.ToString().Should().Contain(PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel);
    }

    [Fact]
    public void Findings_by_severity_section_when_agent_results_omitted_uses_agent_not_stored_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(
            sb,
            new PilotRunDeltas
            {
                AgentResultsIncludedInDetail = false,
                FindingsBySeverity = [],
            });

        sb.ToString().Should().Contain(PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored);
        sb.ToString().Should().NotContain("No unmuted findings were stored for this run.");
    }

    [Fact]
    public void Findings_by_severity_section_when_agent_results_included_empty_severity_aligns_with_total_and_pdf_copy()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = true,
            FindingsBySeverity = [],
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(sb, deltas);

        string md = sb.ToString();
        md.Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.AgentResultsIncludedEmptySeverityPlainLabel);
        md.Should().NotContain(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas));
    }

    [Fact]
    public void Computed_deltas_table_when_agent_results_omitted_findings_source_does_not_cite_architecture_run_detail_results()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                AgentResultsIncludedInDetail = false,
                FindingsCountsFromSnapshot = false,
                FindingsBySeverity = [],
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored);
        row.Should().NotContain("ArchitectureRunDetail.Results[*].Findings");
        row.Should().NotContain("agent results omitted on run detail payload");
    }

    [Fact]
    public void Computed_deltas_table_when_material_finding_without_severity_buckets_findings_source_does_not_cite_agent_results_path()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                AgentResultsIncludedInDetail = true,
                FindingsCountsFromSnapshot = false,
                FindingsBySeverity = [],
                TopFindingId = "f-1",
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);
        row.Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
        row.Should().NotContain("ArchitectureRunDetail.Results[*].Findings");
        row.Should().NotContain("FindingsSnapshot.Findings");
    }

    [Fact]
    public void Computed_deltas_table_when_snapshot_flag_but_material_finding_without_buckets_source_does_not_cite_snapshot_findings_path()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                FindingsCountsFromSnapshot = true,
                FindingsBySeverity = [],
                TopFindingId = "f-1",
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
        row.Should().NotContain("FindingsSnapshot.Findings");
    }

    [Fact]
    public void Computed_deltas_table_when_agent_results_included_empty_severity_findings_source_aligns_with_value_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                AgentResultsIncludedInDetail = true,
                FindingsCountsFromSnapshot = false,
                FindingsBySeverity = [],
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        string plain = PilotRunDeltasFindingsEmptySeverityHonesty.AgentResultsIncludedEmptySeverityPlainLabel;
        row.Should().Contain(plain);
        row.Split('|').Should().HaveCountGreaterThan(3);
        row.Should().NotContain("ArchitectureRunDetail.Results[*].Findings");
    }

    [Fact]
    public void Computed_deltas_table_when_muted_only_empty_severity_findings_source_aligns_with_muted_total_copy()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = true,
            FindingsBySeverity = [],
            MutedFindingsExcludedCount = 2,
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            LlmCallCountResolved = true,
            LlmCallCount = 0,
            AuditRowCountResolved = true,
            AuditRowCount = 0,
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(sb, deltas);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        string mutedCopy = PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel;
        row.Should().Contain(mutedCopy);
        row.Should().NotContain("ArchitectureRunDetail.Results[*].Findings");
        row.Should().NotContain("; muted findings excluded");
    }

    [Fact]
    public void Computed_deltas_table_when_muted_only_and_agent_omitted_findings_source_still_uses_muted_total_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                AgentResultsIncludedInDetail = false,
                FindingsCountsFromSnapshot = false,
                FindingsBySeverity = [],
                MutedFindingsExcludedCount = 1,
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel);
        row.Should().NotContain(FindingsTotalSourceAgentResultsOmittedLabel);
    }

    private static string FindingsTotalSourceAgentResultsOmittedLabel =>
        PilotRunDeltasFindingsEmptySeverityHonesty.FindingsTotalSourceAgentResultsOmittedLabel;

    [Fact]
    public void Computed_deltas_table_when_snapshot_sourced_zero_unmuted_findings_source_aligns_with_total_copy()
    {
        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            sb,
            new PilotRunDeltas
            {
                FindingsCountsFromSnapshot = true,
                FindingsBySeverity = [],
                TimeToCommittedManifest = TimeSpan.FromHours(1),
                ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
                RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                LlmCallCountResolved = true,
                LlmCallCount = 0,
                AuditRowCountResolved = true,
                AuditRowCount = 0,
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings (total) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasFindingsTotalFormatter.SnapshotZeroUnmutedFindingsTotalLabel);
        row.Should().NotContain("`FindingsSnapshot.Findings` (unmuted only)");
    }
}
