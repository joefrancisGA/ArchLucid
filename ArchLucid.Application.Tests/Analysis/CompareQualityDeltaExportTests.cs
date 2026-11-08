using ArchLucid.Application.Analysis;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Ensures compare quality delta counts appear in comparison exports (markdown/HTML/summary), not only in the UI.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompareQualityDeltaExportTests
{
    private static CompareQualityDeltaCounts SampleDelta()
    {
        return new CompareQualityDeltaCounts
        {
            UnsupportedAssumptionsBefore = 2,
            UnsupportedAssumptionsAfter = 1,
            HighSeverityBefore = 3,
            HighSeverityAfter = 2,
            UncoveredMandatoryBefore = 4,
            UncoveredMandatoryAfter = 3,
            EvidenceBackedDecisionsBefore = 5,
            EvidenceBackedDecisionsAfter = 6,
        };
    }

    [SkippableFact]
    public void GenerateMarkdown_default_profile_includes_compare_quality_delta_table()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.GenerateMarkdown(report, profile: null);

        markdown.Should().Contain("## Compare Quality Delta");
        markdown.Should().Contain("Unsupported assumptions");
        markdown.Should().Contain("| 2 | 1 |");
    }

    [SkippableFact]
    public void GenerateHtml_default_profile_includes_compare_quality_delta_section()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, profile: null);

        html.Should().Contain("<h2>Compare Quality Delta</h2>");
        html.Should().Contain("Unsupported assumptions");
        html.Should().Contain("before 2, after 1");
        html.Should().NotContain("<p>| Metric | Before | After |</p>");
    }

    [SkippableFact]
    public void Summary_formatter_includes_compare_quality_delta_section()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("## Compare Quality Delta");
        markdown.Should().Contain("Evidence-backed decisions");
        markdown.Should().Contain("| 5 | 6 |");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_interior_nbsp()
    {
        string markdown = "intro\n## Compare\u00A0Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_thin_space_after_hashes()
    {
        string markdown = "intro\n##\u2009Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_em_space_after_hashes()
    {
        string markdown = "intro\n##\u2003Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_hair_space_after_hashes()
    {
        string markdown = "intro\n##\u200ACompare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_narrow_nbsp_after_hashes()
    {
        string markdown = "intro\n##\u202FCompare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_medium_mathematical_space_after_hashes()
    {
        string markdown = "intro\n##\u205FCompare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_ideographic_space_after_hashes()
    {
        string markdown = "intro\n##\u3000Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_line_starts_with_byte_order_mark()
    {
        string markdown = "intro\n\uFEFF## Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_lines_use_cr_only_line_endings()
    {
        string markdown = "intro\r## Compare Quality Delta\r| Metric | Before | After |\r\r## Warnings\r";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_line_is_tab_indented()
    {
        string markdown = "intro\n\t## Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_through_duplicate_homoglyph_heading_until_next_distinct_section()
    {
        string markdown =
            "intro\n## Compare Quality Delta\n| Metric | Before | After |\n## \u0421ompare Quality Delta\n| dup |\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().NotContain("| dup |");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_through_duplicate_canonical_heading_until_next_distinct_section()
    {
        string markdown =
            "intro\n## Compare Quality Delta\n| Metric | Before | After |\n## Compare Quality Delta\n| dup |\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().NotContain("| dup |");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_does_not_stop_at_inline_hash_token_mid_line()
    {
        string markdown =
            "intro\n## Compare Quality Delta\nSee #tag reference in table footnote.\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_through_level4_heading_under_delta_until_distinct_level2_section()
    {
        string markdown =
            "intro\n## Compare Quality Delta\n| Metric | Before | After |\n#### Footnote\nnote\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().NotContain("#### Footnote");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_stops_at_level1_heading_when_no_following_level2_heading_exists()
    {
        string markdown = "intro\n## Compare Quality Delta\n| Metric | Before | After |\n# Executive summary\nBody text\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("# Executive summary");
        result.Should().Contain("Body text");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_through_level3_subheadings_until_next_level2_heading()
    {
        string markdown =
            "intro\n## Compare Quality Delta\n| Metric | Before | After |\n### Detail row\nmore\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().NotContain("### Detail row");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_does_not_strip_when_heading_text_appears_mid_line()
    {
        string markdown =
            "intro\nSee ## Compare Quality Delta inline.\n\n## Warnings\n| Metric | Before | After |\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().Contain("## Compare Quality Delta inline");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_greek_homoglyph_in_compare()
    {
        string markdown = "intro\n## C\u03BFmpare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_combines_cyrillic_and_fullwidth_homoglyphs()
    {
        string markdown = "intro\n## \u0421\uFF4F\uFF4D\uFF50\uFF41\uFF52\uFF45 Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_cyrillic_homoglyph_in_compare()
    {
        string markdown = "intro\n## \u0421ompare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_fullwidth_latin_letters()
    {
        string markdown = "intro\n## \uFF23\uFF4F\uFF4D\uFF50\uFF41\uFF52\uFF45 Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_mixed_case()
    {
        string markdown = "intro\n## compare quality delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("compare quality delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_combining_diacritic_mid_line()
    {
        string markdown = "intro\n## Comp\u0061\u0301re Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_embeds_variation_selector_mid_line()
    {
        string markdown = "intro\n## Compare\uFE00 Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_embeds_zero_width_joiner_mid_line()
    {
        string markdown = "intro\n## Compare\u200D Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_embeds_soft_hyphen_mid_line()
    {
        string markdown = "intro\n## Compare\u00AD Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_embeds_byte_order_mark_mid_line()
    {
        string markdown = "intro\n## Compare\uFEFF Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_vertical_tab_after_hashes()
    {
        string markdown = "intro\n##\u000BCompare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_line_separator_after_hashes()
    {
        string markdown = "intro\n##\u2028Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_ogham_space_mark_after_hashes()
    {
        string markdown = "intro\n##\u1680Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_figure_space_after_hashes()
    {
        string markdown = "intro\n##\u2007Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [Fact]
    public void RemoveMarkdownSection_strips_compare_quality_delta_when_heading_uses_nbsp_after_hashes()
    {
        string markdown = "intro\n##\u00A0Compare Quality Delta\n| Metric | Before | After |\n\n## Warnings\nnote\n";

        string result = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(markdown);

        result.Should().NotContain("Compare Quality Delta");
        result.Should().Contain("## Warnings");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_profile_includes_compare_quality_delta_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string markdown = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        markdown.Split("## Compare Quality Delta", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces compare quality delta");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_profile_includes_compare_quality_delta_once_when_summary_uses_nbsp_heading()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter
            .Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Summary\n##\u00A0Compare Quality Delta\n| Metric | Before | After |\n| --- | --- | --- |\n| x | 1 | 2 |");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Split("<h2>Compare Quality Delta</h2>", StringSplitOptions.None).Length.Should().Be(2,
            "NBSP-prefixed summary headings must still be stripped before HTML re-appends compare quality delta");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            InterpretationNotes = ["Structural execution mode differs between runs."],
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        string markdown = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        markdown.Split("## Interpretation Notes", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces interpretation notes");
        markdown.Split("## Warnings", StringSplitOptions.None).Length.Should().Be(2,
            "detailed exports embed the summary formatter, which already surfaces warnings");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            InterpretationNotes = ["Structural execution mode differs between runs."],
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Split("<h2>Interpretation Notes</h2>", StringSplitOptions.None).Length.Should().Be(2);
        html.Split("<h2>Warnings</h2>", StringSplitOptions.None).Length.Should().Be(2);
    }

    [SkippableFact]
    public async Task GeneratePdf_default_profile_includes_compare_quality_delta_when_summary_formatter_omits_section()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("Compare Quality Delta");
        text.Should().Contain("before 2");
        text.Should().Contain("before 3");
    }

    [SkippableFact]
    public async Task GenerateDocx_default_profile_includes_compare_quality_delta_when_summary_formatter_omits_section()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            CompareQualityDelta = SampleDelta(),
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Compare Quality Delta");
        text.Should().Contain("Unsupported assumptions: before 2, after 1");
    }

    private static string ExtractPdfText(byte[] pdfBytes)
    {
        using MemoryStream stream = new(pdfBytes);
        using UglyToad.PdfPig.PdfDocument document = UglyToad.PdfPig.PdfDocument.Open(stream);

        return string.Join(
            "\n",
            document.GetPages().Select(page => page.Text?.Trim() ?? string.Empty).Where(text => text.Length > 0));
    }

    private static string ExtractDocxBodyText(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using DocumentFormat.OpenXml.Packaging.WordprocessingDocument doc =
            DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.InnerText;
    }
}
