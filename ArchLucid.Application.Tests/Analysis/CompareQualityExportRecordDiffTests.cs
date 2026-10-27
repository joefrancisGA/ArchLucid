using ArchLucid.Application.Analysis;

using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareQualityExportRecordDiffTests
{
    [Fact]
    public void CompareQuality_export_record_diff_treats_uppercase_and_lowercase_hex_run_ids_as_same_run()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = runId.ToString("N").ToUpperInvariant(),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = runId.ToString("N").ToLowerInvariant(),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.Warnings.Should().NotContain(w => w.Contains("different runs", StringComparison.OrdinalIgnoreCase));
    }

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
        result.Warnings.Should().NotContain(w => w.Contains("different export types", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CompareQuality_export_record_diff_canonicalizes_nested_compare_run_id_in_request_diff()
    {
        Guid compareRunId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"  {{compareRunId.ToString("D")}}  "}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "b.md",
            AnalysisRequestJson =
                $$"""{"includeAgentResultCompare":true,"compareRunId":"  {{compareRunId.ToString("D")}}  "}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.LeftRequest!.CompareRunId.Should().Be(compareRunId.ToString("N"));
        result.RequestDiff.RightRequest!.CompareRunId.Should().Be(compareRunId.ToString("N"));
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_padding_only_notes_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "  reviewer note  ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "reviewer note",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Notes");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_resolution_reason_trailing_newline_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            ResolutionReason = "auto-selected template\n",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            ResolutionReason = "auto-selected template",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("ResolutionReason");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_manifest_version_trailing_whitespace_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            ManifestVersion = "1.2.3 ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            ManifestVersion = "1.2.3",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("ManifestVersion");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_notes_crlf_as_equivalent_to_lf()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "reviewer note\r\nsecond line",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "reviewer note\nsecond line",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Notes");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_notes_unicode_line_separator_as_equivalent_to_lf()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "line one\u2028line two",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "line one\nline two",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Notes");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_compare_manifest_version_trailing_whitespace_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareManifestVersion = "2.0.0 ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareManifestVersion = "2.0.0",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("CompareManifestVersion");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_export_type_casing_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "architectureanalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("ExportType");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_format_casing_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Format");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_file_name_path_separators_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "exports\\analysis.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "exports/analysis.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("FileName");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_template_profile_display_name_diacritic_forms_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        const string composed = "Meridi\u00e1n Advisory";
        const string decomposed = "Meridi" + "a\u0301" + "n Advisory";

        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            TemplateProfileDisplayName = composed,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            TemplateProfileDisplayName = decomposed,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("TemplateProfileDisplayName");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_whitespace_only_notes_as_equivalent_to_null()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "   ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("Notes");
    }

    [Fact]
    public void CompareQuality_export_record_diff_reports_notes_when_values_differ_after_trim()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "draft",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            Notes = "final",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().Contain("Notes");
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
    public void CompareQuality_export_record_diff_ignores_padding_only_template_profile_column_when_json_matches()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            TemplateProfile = "  sponsor  ",
            AnalysisRequestJson = """{"templateProfile":"sponsor"}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            TemplateProfile = "sponsor",
            AnalysisRequestJson = """{"templateProfile":"sponsor"}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("TemplateProfile");
        result.RequestDiff.ChangedValues.Should().NotContain("TemplateProfile");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_false_included_determinism_check_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedDeterminismCheck = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedDeterminismCheck = false,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("IncludedDeterminismCheck");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_determinism_iterations_when_check_disabled_in_requests()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":false,"determinismIterations":3}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":false}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_ignores_top_level_determinism_iterations_when_check_disabled()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedDeterminismCheck = false,
            DeterminismIterations = 5,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedDeterminismCheck = null,
            DeterminismIterations = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_false_included_manifest_compare_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedManifestCompare = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedManifestCompare = false,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("IncludedManifestCompare");
    }

    [Fact]
    public void CompareQuality_export_record_diff_flags_determinism_iterations_when_only_one_request_enables_check()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":true,"determinismIterations":3}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":false,"determinismIterations":3}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedFlags.Should().Contain("IncludeDeterminismCheck");
        result.RequestDiff.ChangedValues.Should().Contain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_false_included_evidence_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedEvidence = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedEvidence = false,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("IncludedEvidence");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_false_included_summary_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedSummary = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedSummary = false,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("IncludedSummary");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_false_included_agent_result_compare_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedAgentResultCompare = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            IncludedAgentResultCompare = false,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("IncludedAgentResultCompare");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_omitted_and_stale_determinism_iterations_as_equivalent_when_check_disabled()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":false}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":false,"determinismIterations":3}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_zero_and_omitted_determinism_iterations_as_equivalent_when_check_enabled()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":true,"determinismIterations":0}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeDeterminismCheck":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_omitted_and_false_include_determinism_check_in_requests_as_equivalent()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
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
            AnalysisRequestJson = """{"includeManifest":true,"includeDeterminismCheck":false}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedFlags.Should().NotContain("IncludeDeterminismCheck");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_null_and_zero_determinism_iterations_as_equivalent_on_top_level_columns()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            DeterminismIterations = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            DeterminismIterations = 0,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("DeterminismIterations");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_whitespace_only_template_profile_in_json_as_equivalent_to_null()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"templateProfile":"   "}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("TemplateProfile");
    }

    [Fact]
    public void CompareQuality_export_record_diff_treats_whitespace_only_audience_as_equivalent_to_null_in_requests()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"audience":"   "}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.RequestDiff.ChangedValues.Should().NotContain("Audience");
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
    public void CompareQuality_export_record_diff_treats_whitespace_only_compare_run_column_as_equivalent_to_null()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = "   ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = null,
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().NotContain("CompareRunId");
    }

    [Fact]
    public void CompareQuality_scoped_export_read_normalizer_nulls_whitespace_only_compare_run_id_column()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "export-whitespace-compare-run",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            CompareRunId = "   ",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        RunExportRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.CompareRunId.Should().BeNull();
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

    [Fact]
    public void CompareQuality_export_record_diff_normalizes_padded_export_record_ids_on_result()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "  left-anchor  ",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "  right-anchor  ",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "b.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.LeftExportRecordId.Should().Be("left-anchor");
        result.RightExportRecordId.Should().Be("right-anchor");
    }
}
