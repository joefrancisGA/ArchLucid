using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests;
[Trait("Category", "Unit")]

public sealed class MarkdownExportFormattingTests
{
    [SkippableFact]
    public void MarkdownDriftReportFormatter_FormatMarkdown_includes_drift_and_table_rows()
    {
        MarkdownDriftReportFormatter fmt = new();
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Summary = "S",
            Items =
            [
                new DriftItem
                {
                    Category = "C",
                    Path = "p|ipe",
                    StoredValue = "old",
                    RegeneratedValue = "new",
                    Description = "d\nline",
                },
            ],
        };

        string md = fmt.FormatMarkdown(drift, "rec-1");

        md.Should().Contain("# ArchLucid Comparison Drift Report");
        md.Should().Contain("`rec-1`");
        md.Should().Contain("Drift detected:** Yes");
        md.Should().Contain("## Differences");
        md.Should().Contain("| C |");
        md.Should().Contain("d line");
    }

    [SkippableFact]
    public void MarkdownDriftReportFormatter_FormatMarkdown_uses_trimmed_comparison_record_id()
    {
        MarkdownDriftReportFormatter fmt = new();
        DriftAnalysisResult drift = new() { DriftDetected = false };

        string md = fmt.FormatMarkdown(drift, "  rec-padded  ");

        md.Should().Contain("`rec-padded`");
        md.Should().NotContain("`  rec-padded  `");
    }

    [SkippableFact]
    public void MarkdownDriftReportFormatter_FormatHtml_encodes_comparison_id()
    {
        MarkdownDriftReportFormatter fmt = new();
        DriftAnalysisResult drift = new() { DriftDetected = false };

        string html = fmt.FormatHtml(drift, "<b>x</b>");

        html.Should().Contain("&lt;b&gt;x&lt;/b&gt;");
    }

    [SkippableFact]
    public void MarkdownDriftReportFormatter_labels_missing_comparison_record_id()
    {
        MarkdownDriftReportFormatter fmt = new();
        DriftAnalysisResult drift = new() { DriftDetected = false };

        string md = fmt.FormatMarkdown(drift, "   ");
        string html = fmt.FormatHtml(drift, null);

        md.Should().Contain("Comparison record id was not stored.");
        html.Should().Contain("Comparison record id was not stored.");
    }

    [SkippableFact]
    public void MarkdownDriftReportFormatter_html_table_cells_use_not_stored_copy()
    {
        MarkdownDriftReportFormatter fmt = new();
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Items =
            [
                new DriftItem
                {
                    Category = "",
                    Path = "",
                    StoredValue = null,
                    RegeneratedValue = "new",
                    Description = "",
                },
            ],
        };

        string html = fmt.FormatHtml(drift, "rec-1");

        html.Should().Contain("Value was not stored.");
    }

    [SkippableFact]
    public void MarkdownExportRecordDiffSummaryFormatter_lists_sections()
    {
        MarkdownExportRecordDiffSummaryFormatter fmt = new();
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "L",
            RightExportRecordId = "R",
            LeftRunId = "lr",
            RightRunId = "rr",
            ChangedTopLevelFields = ["a"],
            RequestDiff = new ExportRecordRequestDiff { ChangedFlags = [], ChangedValues = ["v"], },
            Warnings = ["w"],
        };

        string md = fmt.FormatMarkdown(diff);

        md.Should().Contain("L -> R");
        md.Should().Contain("## Changed Top-Level Fields");
        md.Should().Contain("## Warnings");
    }

    [SkippableFact]
    public void MarkdownExportRecordDiffSummaryFormatter_uses_trimmed_export_record_ids_in_heading()
    {
        MarkdownExportRecordDiffSummaryFormatter fmt = new();
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-anchor  ",
            RightExportRecordId = "  right-anchor  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };

        string md = fmt.FormatMarkdown(diff);

        md.Should().Contain("# Export Record Comparison: left-anchor -> right-anchor");
    }

    [SkippableFact]
    public void MarkdownExportRecordDiffSummaryFormatter_trims_nested_compare_manifest_version_on_format()
    {
        MarkdownExportRecordDiffSummaryFormatter fmt = new();
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "left",
            RightExportRecordId = "right",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RequestDiff = new ExportRecordRequestDiff
            {
                RightRequest = new PersistedAnalysisExportRequest
                {
                    IncludeManifestCompare = true,
                    CompareManifestVersion = "  v2  ",
                },
            },
        };

        fmt.FormatMarkdown(diff);

        diff.RequestDiff.RightRequest.Should().NotBeNull();
        diff.RequestDiff.RightRequest!.CompareManifestVersion.Should().Be("v2");
    }

    [SkippableFact]
    public void MarkdownArchitectureExportService_includes_diagram_fence_and_evidence_counts()
    {
        MarkdownArchitectureExportService svc = new();
        GoldenManifest m = new() { SystemName = "Sys" };
        AgentEvidencePackage ev = new()
        {
            EvidencePackageId = "e1",
            RunId = "r1",
            RequestId = "q1",
            Policies = [new PolicyEvidence()],
            ServiceCatalog = [new ServiceCatalogEvidence()],
            Patterns = [new PatternEvidence()],
            Notes = [new EvidenceNote()],
        };

        string md = svc.GenerateMarkdownPackage(m, "graph TD\nA-->B", "Summary **text**", ev);

        md.Should().Contain("# Architecture Export: Sys");
        md.Should().Contain("```mermaid");
        md.Should().Contain(MarkdownPackageExportHonestyCopy.DiagramStoredNotObservedTrafficDisclaimer);
        md.Should().Contain("Summary **text**");
        md.Should().Contain("Evidence Package Snapshot");
        md.Should().Contain("Policy Count: 1");
    }

    [SkippableFact]
    public void MarkdownArchitectureExportService_labels_missing_evidence_package_when_null()
    {
        MarkdownArchitectureExportService svc = new();
        GoldenManifest m = new() { SystemName = "Sys" };

        string md = svc.GenerateMarkdownPackage(m, "graph TD\nA-->B", "Summary", null);

        md.Should().Contain("Evidence package was not stored.");
    }

    [SkippableFact]
    public void MarkdownArchitectureExportService_labels_missing_system_diagram_summary_and_evidence_ids()
    {
        MarkdownArchitectureExportService svc = new();
        GoldenManifest m = new() { SystemName = "  " };
        AgentEvidencePackage ev = new()
        {
            EvidencePackageId = "",
            RunId = "",
            RequestId = "",
        };

        string md = svc.GenerateMarkdownPackage(m, "   ", "  ", ev);

        md.Should().Contain("# Architecture Export: System name was not stored.");
        md.Should().Contain("Diagram was not stored.");
        md.Should().NotContain("```mermaid");
        md.Should().Contain("Architecture summary was not stored.");
        md.Should().Contain("Evidence package id was not stored.");
        md.Should().Contain("Run ID was not stored.");
        md.Should().Contain("Request ID was not stored.");
    }
}
