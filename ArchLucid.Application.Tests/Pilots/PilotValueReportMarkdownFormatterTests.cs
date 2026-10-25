using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotValueReportMarkdownFormatterTests
{
    [Fact]
    public void Format_uses_export_formatter_for_timeline_dates()
    {
        ExportFormatterService fmt = new();
        PilotValueReportMarkdownFormatter sut = new(fmt);
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime committed = from.AddHours(2);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = committed,
                    SystemName = "test",
                },
            ],
        };

        string md = sut.Format(report);

        md.Should().Contain(fmt.FormatIso8601Utc(from));
        md.Should().Contain(fmt.FormatIso8601Utc(committed));
    }

    [Fact]
    public void Format_includes_sendable_export_cover_honesty_lines()
    {
        ExportFormatterService fmt = new();
        PilotValueReportMarkdownFormatter sut = new(fmt);
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
        };

        string md = sut.Format(report);

        md.Should().Contain("**Sponsor ROI honesty:**");
        md.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
        md.Should().Contain("**Policy influence:**");
        md.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
    }

    [Fact]
    public void Format_labels_missing_average_pipeline_completion_as_not_stored()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());

        string markdown = sut.Format(new PilotValueReport
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = DateTime.UtcNow.AddDays(-1),
            ToUtc = DateTime.UtcNow,
            AveragePipelineCompletionSeconds = null,
        });

        markdown.Should().Contain("Average pipeline completion was not stored.");
        markdown.Should().NotContain("| Avg pipeline completion | — |");
    }

    [Fact]
    public void Format_when_run_details_truncated_discloses_newest_run_sampling()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 50,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("newest", "sponsor markdown must match TakeLast run-detail sampling");
        markdown.Should().NotContain("earliest", "earliest-run wording contradicts PilotValueReportService");
    }

    [Fact]
    public void Format_when_run_details_truncated_qualifies_total_findings_as_partial_run_detail_sample()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 200,
            TotalFindings = 88,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = from.AddHours(1),
                    SystemName = "alpha",
                },
            ],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain(
            "| Total findings | 88 (partial run-detail sample:",
            "finding totals must not read as tenant-wide when only newest committed runs were loaded");
    }

    [Fact]
    public void Format_when_run_details_truncated_qualifies_avg_pipeline_completion_as_partial_run_detail_sample()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 10,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            AveragePipelineCompletionSeconds = 120,
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = from.AddHours(1),
                    SystemName = "alpha",
                },
            ],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain(
            "| Avg pipeline completion | 2 min (partial run-detail sample:",
            "avg completion must not read as tenant-wide when only newest committed runs were loaded");
    }

    [Fact]
    public void Format_when_committed_runs_exist_but_no_run_details_loaded_does_not_emit_zero_findings_as_tenant_total()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = 3,
            TotalFindings = 0,
            RunDetailsTruncated = false,
            CommittedRunsTimeline = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("not computed — no committed runs loaded for detail");
        markdown.Should().NotContain("| Total findings | 0 |");
        markdown.Should().Contain(
            "Agent types were not computed — no committed runs loaded for detail in the partial sample.");
        markdown.Should().NotContain("Agent types were not stored.");
        markdown.Should().Contain(
            "| Avg pipeline completion | not computed — no committed runs loaded for detail in the partial sample |");
        markdown.Should().NotContain("| Critical | 0 |");
        markdown.Should().Contain("## Committed runs (0 of 3 in-window committed runs loaded for detail)");
        markdown.Should().NotContain("## Committed runs (sample loaded for detail)");
        markdown.Should().Contain(
            "| Committed runs | 3 (0 loaded for detail in partial sample) |");
        markdown.Should().NotContain("| Committed runs | 3 |");
    }

    [Fact]
    public void Format_when_committed_runs_exist_but_no_run_details_loaded_omits_severity_table_even_when_buckets_nonzero()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = 2,
            TotalFindings = 12,
            AveragePipelineCompletionSeconds = 90,
            RunDetailsTruncated = false,
            CommittedRunsTimeline = [],
            FindingsBySeverity = new PilotValueReportSeverityBreakdown
            {
                Critical = 1,
                High = 2,
                Medium = 3,
                Low = 0,
                Info = 6,
            },
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("Severity counts were not computed");
        markdown.Should().NotContain("| Critical | 1 |");
        markdown.Should().NotContain("| Avg pipeline completion | 1 min 30 s |");
    }

    [Fact]
    public void Format_when_run_details_truncated_with_empty_timeline_does_not_label_positive_findings_as_partial_sample()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 10,
            TotalFindings = 88,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            CommittedRunsTimeline = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("not computed — no committed runs loaded for detail");
        markdown.Should().NotContain("| Total findings | 88 (partial run-detail sample:");
    }

    [Fact]
    public void Format_when_run_details_truncated_with_empty_timeline_does_not_label_zero_findings_as_partial_sample()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 10,
            TotalFindings = 0,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            CommittedRunsTimeline = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("not computed — no committed runs loaded for detail");
        markdown.Should().NotContain("| Total findings | 0 (partial run-detail sample:");
        markdown.Should().Contain("Severity counts were not computed");
    }

    [Fact]
    public void Format_when_run_details_truncated_with_empty_timeline_qualifies_run_detail_cap_metadata()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 10,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            CommittedRunsTimeline = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("0 of newest committed runs loaded for detail");
        markdown.Should().Contain("sample: 0 of");
    }

    [Fact]
    public void Format_when_run_details_truncated_discloses_timeline_sample_size_in_section_header()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 25,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = from.AddHours(1),
                    SystemName = "alpha",
                },
            ],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("sample: 1 of");
        markdown.Should().Contain($"{cap + 25} in-window committed runs loaded for detail");
    }

    [Fact]
    public void Format_when_run_details_truncated_with_empty_agent_types_explains_partial_sample_not_missing_storage()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            RunDetailsTruncated = true,
            RunDetailCap = cap,
            UniqueAgentTypes = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("excluded by the cap");
        markdown.Should().NotContain("Agent types were not stored.");
    }

    [Fact]
    public void Format_when_run_details_truncated_discloses_partial_sample_on_agent_types_section()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            RunDetailsTruncated = true,
            RunDetailCap = PilotValueReportService.DefaultRunDetailCap,
            UniqueAgentTypes = ["ReviewAgent"],
        };

        string markdown = sut.Format(report);

        int agentHeading = markdown.IndexOf("## Agent types observed", StringComparison.Ordinal);
        agentHeading.Should().BeGreaterThan(-1);
        string agentSection = markdown[agentHeading..];
        agentSection.Should().Contain(
            "> Agent types listed reflect",
            "agent-type list must not read as tenant-wide when run-detail cap applied");
    }

    [Fact]
    public void Format_when_run_details_truncated_discloses_partial_sample_on_findings_by_severity_section()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            RunDetailsTruncated = true,
            RunDetailCap = PilotValueReportService.DefaultRunDetailCap,
            FindingsBySeverity = new PilotValueReportSeverityBreakdown { Critical = 2, High = 1 },
        };

        string markdown = sut.Format(report);

        int severityHeading = markdown.IndexOf("## Findings by severity", StringComparison.Ordinal);
        severityHeading.Should().BeGreaterThan(-1);
        string severitySection = markdown[severityHeading..];
        severitySection.Should().Contain(
            "> Severity counts reflect a partial run-detail sample",
            "severity buckets must not read as tenant-wide when run-detail cap applied");
    }

    [Fact]
    public void Format_discloses_committed_run_inventory_truncation()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            CommittedRunsInventoryTruncated = true,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Committed-run inventory truncated | True |");
    }

    [Fact]
    public void Format_when_committed_run_inventory_truncated_qualifies_total_runs_committed_as_partial_inventory()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = 12_000,
            CommittedRunsInventoryTruncated = true,
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = from.AddHours(1),
                    SystemName = "alpha",
                },
            ],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain(
            "under-count",
            "metadata count must warn sponsors when keyset inventory collection stopped early");
    }

    [Fact]
    public void Format_when_audit_export_truncated_with_empty_timeline_still_surfaces_comparison_drift_count()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            AuditExportTruncated = true,
            ComparisonOrDriftDetections = 5,
            RunDetailsTruncated = true,
            RunDetailCap = PilotValueReportService.DefaultRunDetailCap,
            TotalRunsCommitted = PilotValueReportService.DefaultRunDetailCap + 1,
            CommittedRunsTimeline = [],
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Comparison / drift detections | 5 |");
        markdown.Should().Contain("| Audit export truncated | True |");
    }

    [Fact]
    public void Format_when_audit_export_truncated_discloses_truncation_in_metadata_not_summary_recommendations_row()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            AuditExportTruncated = true,
            TotalRecommendationsProduced = 12,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Audit export truncated | True |");
        markdown.Should().Contain("| Recommendations generated (audit) | 12 |");
        markdown.Should().NotContain("partial audit");
    }

    [Fact]
    public void Format_when_audit_export_truncated_discloses_truncation_in_metadata_not_summary_policy_pack_row()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            AuditExportTruncated = true,
            PolicyPackAssignments = 7,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Audit export truncated | True |");
        markdown.Should().Contain("| Policy pack assignments | 7 |");
        markdown.Should().NotContain("partial audit");
    }

    [Fact]
    public void Format_when_audit_export_truncated_discloses_truncation_in_metadata_not_summary_governance_rows()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            AuditExportTruncated = true,
            GovernanceApprovals = 3,
            GovernanceRejections = 1,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Audit export truncated | True |");
        markdown.Should().Contain("| Governance approvals | 3 |");
        markdown.Should().Contain("| Governance rejections | 1 |");
        markdown.Should().NotContain("partial audit");
    }

    [Fact]
    public void Format_when_audit_export_truncated_discloses_truncation_in_metadata_not_summary_comparison_row()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            AuditExportTruncated = true,
            ComparisonOrDriftDetections = 42,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| Audit export truncated | True |");
        markdown.Should().Contain("| Comparison / drift detections | 42 |");
        markdown.Should().NotContain("partial audit");
    }

    [Fact]
    public void Format_discloses_roi_source_freshness_disposition_in_metadata_table()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            RoiSourceFreshnessDisposition = "HOLD",
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("| ROI source freshness disposition | HOLD |");
    }

    [Fact]
    public void Format_labels_empty_agent_types_system_name_and_missing_commit_time()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            UniqueAgentTypes = [],
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = null,
                    SystemName = "",
                },
            ],
            AveragePipelineCompletionSeconds = double.NaN,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("Agent types were not stored.");
        markdown.Should().Contain("System name was not stored.");
        markdown.Should().Contain("Committed time was not stored.");
        markdown.Should().Contain("Average pipeline completion was not stored.");
    }
}
