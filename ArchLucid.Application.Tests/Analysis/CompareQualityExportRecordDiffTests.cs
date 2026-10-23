using ArchLucid.Application.Analysis;

using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareQualityExportRecordDiffTests
{
    [Fact]
    public void CompareQuality_export_record_diff_treats_equivalent_guid_run_ids_as_same_run()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = runId.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = runId.ToString("D"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.Warnings.Should().NotContain(w => w.Contains("different runs", StringComparison.OrdinalIgnoreCase));
        result.RequestDiff.ChangedValues.Should().NotContain("CompareRunId");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_equivalent_compare_run_ids_as_unchanged()
    {
        Guid compareRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = compareRunId.ToString("N"),
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId.ToString("N")}}"}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = compareRunId.ToString("D"),
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId.ToString("D")}}"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("CompareRunId");
        result.RequestDiff.ChangedValues.Should().NotContain("CompareRunId");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_export_type_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "  ArchitectureAnalysis  ",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("ExportType");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_format_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "  Markdown  ",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Format");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_file_name_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "  report.md  ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "report.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("FileName");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_audience_in_rehydrated_requests()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"audience":"  sponsor  "}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"audience":"sponsor"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("Audience");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_compare_manifest_version_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareManifestVersion = "  v2  ",
            AnalysisRequestJson = """{"includeManifestCompare":true,"compareManifestVersion":"v2"}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareManifestVersion = "v2",
            AnalysisRequestJson = """{"includeManifestCompare":true,"compareManifestVersion":"v2"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("CompareManifestVersion");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_compare_run_id_on_top_level_columns()
    {
        const string compareRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = $"  {compareRunId}  ",
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId}}"}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = compareRunId,
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId}}"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("CompareRunId");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_compare_run_id_differences_in_stored_json()
    {
        const string compareRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"  {{compareRunId}}  "}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId}}"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("CompareRunId");
    }

    [Fact]
    public void CompareQuality_export_record_diff_canonicalizes_run_ids_on_result()
    {
        Guid runId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        string canonicalRunId = runId.ToString("N");
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = canonicalRunId,
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = runId.ToString("D"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.LeftRunId.Should().Be(canonicalRunId);
        result.RightRunId.Should().Be(canonicalRunId);
    }
}
