using System.Text;

using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportDeltasSectionFormatterTests
{
    [Fact]
    public void AppendComputedDeltasSection_when_llm_count_unresolved_does_not_emit_zero_in_table()
    {
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
            AuditRowCount = 1,
            LlmCallCount = 0,
            LlmCallCountResolved = false,
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(sb, deltas);

        string markdown = sb.ToString();
        markdown.Should().NotContain("| LLM calls for this run | 0 |");
        markdown.Should().Contain("not attested");
    }

    [Fact]
    public void AppendComputedDeltasSection_when_audit_rows_truncated_discloses_cap_in_audit_metric_row()
    {
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
            AuditRowCount = 500,
            AuditRowCountTruncated = true,
            LlmCallCountResolved = true,
            LlmCallCount = 0,
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(sb, deltas);

        string markdown = sb.ToString();
        markdown.Should().Contain("query cap reached");
        markdown.Should().NotContain("RunDetailsTruncated");
    }

    [Fact]
    public void AppendComputedDeltasSection_when_findings_not_attested_does_not_emit_zero_total()
    {
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            FindingsBySeverity = [],
            LlmCallCountResolved = true,
            LlmCallCount = 0,
            AuditRowCountResolved = true,
            AuditRowCount = 0,
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(sb, deltas);

        string markdown = sb.ToString();
        markdown.Should().Contain(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);
        markdown.Should().NotContain("| Findings (total) | 0 |");
    }

    [Fact]
    public void AppendElapsedSection_uses_utf8_middle_dot_between_created_and_committed_timestamps()
    {
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            TimeToCommittedManifest = TimeSpan.FromHours(1),
        };

        StringBuilder sb = new();
        FirstValueReportDeltasSectionFormatter.AppendElapsedSection(sb, deltas);

        string markdown = sb.ToString();
        markdown.Should().Contain("Created: `2026-04-01T12:00:00.0000000Z` · Committed:");
        markdown.Should().NotContain("Â·");
    }
}
