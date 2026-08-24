using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.ArtifactSynthesis.Sanitization;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest.Sections;

using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC27 package-coverage batch: export sanitizers, region advisory checks, decommission intent detection, and DOCX
///     body builders.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc27Tests
{
    [Fact]
    public void FileNameSanitizer_rejects_null()
    {
        FluentActions
            .Invoking(() => FileNameSanitizer.Sanitize(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("report:v1?.docx", "report_v1_.docx")]
    [InlineData("a<b>c|d*e", "a_b_c_d_e")]
    [InlineData("path\\file/name", "path_file_name")]
    [InlineData("..／..／manifest.json", ".._.._manifest.json")]
    public void FileNameSanitizer_replaces_invalid_windows_characters(string input, string expected)
    {
        string sanitized = FileNameSanitizer.Sanitize(input);

        sanitized.Should().Be(expected);
    }

    [Theory]
    [InlineData("   ")]
    [InlineData(" ")]
    [InlineData("\t\t")]
    [InlineData("\t\r\n")]
    public void FileNameSanitizer_returns_artifact_txt_for_whitespace_only(string input)
    {
        string sanitized = FileNameSanitizer.Sanitize(input);

        sanitized.Should().Be("artifact.txt");
    }

    [Fact]
    public void FileNameSanitizer_preserves_normal_names()
    {
        FileNameSanitizer.Sanitize("architecture-package.md").Should().Be("architecture-package.md");
        FileNameSanitizer.Sanitize("Findings_Summary.docx").Should().Be("Findings_Summary.docx");
    }

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void LlmArtifactFreeTextSanitizer_returns_empty_for_null_or_empty(string? input, string expected)
    {
        string sanitized = LlmArtifactFreeTextSanitizer.Sanitize(input);

        sanitized.Should().Be(expected);
    }

    [Fact]
    public void LlmArtifactFreeTextSanitizer_preserves_tab_cr_lf_and_spaces()
    {
        const string input = "line1\r\nline2\tspaced";

        string sanitized = LlmArtifactFreeTextSanitizer.Sanitize(input);

        sanitized.Should().Be(input);
    }

    [Fact]
    public void LlmArtifactFreeTextSanitizer_strips_control_chars_below_0x20()
    {
        string input = "ok" + (char)0x01 + (char)0x1F + "done";

        string sanitized = LlmArtifactFreeTextSanitizer.Sanitize(input);

        sanitized.Should().Be("okdone");
    }

    [Fact]
    public void LlmArtifactFreeTextSanitizer_strips_bidi_overrides_isolates_and_zw_marks()
    {
        string input =
            "safe"
            + "\u202A\u202B\u202C\u202D\u202E"
            + "\u2066\u2067\u2068\u2069"
            + "\u200B\u200C\u200D\u200E\u200F\uFEFF"
            + "text";

        string sanitized = LlmArtifactFreeTextSanitizer.Sanitize(input);

        sanitized.Should().Be("safetext");
    }

    [Theory]
    [InlineData("", "Microsoft.KeyVault/vaults")]
    [InlineData("   ", "Microsoft.CognitiveServices/accounts")]
    [InlineData("qatarcentral", "")]
    [InlineData("qatarcentral", "   ")]
    public void ArchitectureRecommendationRegionValidator_returns_null_for_blank_region_or_suggestion(
        string region,
        string suggestion)
    {
        string? warning = ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning(region, suggestion);

        warning.Should().BeNull();
    }

    [Theory]
    [InlineData("Microsoft.KeyVault/vaults")]
    [InlineData("Microsoft.Storage/storageAccounts")]
    [InlineData("Microsoft.Sql/servers")]
    [InlineData("Microsoft.Web/sites")]
    [InlineData("Microsoft.ContainerRegistry/registries")]
    public void ArchitectureRecommendationRegionValidator_returns_null_for_global_services(string service)
    {
        string? warning =
            ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning("qatarcentral", service);

        warning.Should().BeNull();
    }

    [Fact]
    public void ArchitectureRecommendationRegionValidator_warns_when_restricted_service_is_unavailable()
    {
        string? warning = ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning(
            "qatarcentral",
            "Microsoft.CognitiveServices/accounts");

        warning.Should().NotBeNull();
        warning.Should().Contain("RegionMismatch");
        warning.Should().Contain("qatarcentral");
        warning.Should().Contain("Microsoft.CognitiveServices/accounts");
    }

    [Fact]
    public void ArchitectureRecommendationRegionValidator_returns_null_for_unrestricted_region()
    {
        string? warning = ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning(
            "eastus",
            "Microsoft.CognitiveServices/accounts");

        warning.Should().BeNull();
    }

    [Fact]
    public void TerraformAdvisoryDecommissionIntentDetector_rejects_null_decision()
    {
        FluentActions
            .Invoking(() => TerraformAdvisoryDecommissionIntentDetector.LooksLikeDecommissionRequest(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("Delete unused disks", "Keep for now", "Stable workload")]
    [InlineData("Resize SKU", "Remove public endpoints", "Hardening")]
    [InlineData("Lifecycle", "Retain", "Plan to decommission staging")]
    [InlineData("Cleanup", "Retain", "Tear down orphaned NICs")]
    [InlineData("Cleanup", "Retain", "Tear-down orphaned NICs")]
    [InlineData("Cleanup", "Retain", "Unprovision unused App Services")]
    [InlineData("Cleanup", "Retain", "Destroy unused storage")]
    public void TerraformAdvisoryDecommissionIntentDetector_matches_destructive_language(
        string title,
        string selectedOption,
        string rationale)
    {
        ResolvedArchitectureDecision decision = CreateDecision(title, selectedOption, rationale);

        bool matched = TerraformAdvisoryDecommissionIntentDetector.LooksLikeDecommissionRequest(decision);

        matched.Should().BeTrue();
    }

    [Fact]
    public void TerraformAdvisoryDecommissionIntentDetector_returns_false_for_clean_text()
    {
        ResolvedArchitectureDecision decision = CreateDecision(
            "Prefer private endpoints",
            "Use private link",
            "Improves network isolation without removing capacity.");

        bool matched = TerraformAdvisoryDecommissionIntentDetector.LooksLikeDecommissionRequest(decision);

        matched.Should().BeFalse();
    }

    [Fact]
    public void WordDocumentBuilder_adds_paragraphs_headings_body_and_lists()
    {
        Body body = new();

        WordDocumentBuilder.AddParagraph(body, "Plain");
        WordDocumentBuilder.AddHeading(body, "Heading", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBodyText(body, "Body copy");
        WordDocumentBuilder.AddMultilineBodyText(body, "   ");
        WordDocumentBuilder.AddMultilineBodyText(body, "Block one\n\nBlock two");
        WordDocumentBuilder.AddMonospaceSourceLines(body, string.Empty);
        WordDocumentBuilder.AddMonospaceSourceLines(body, "line-a\nline-b");
        WordDocumentBuilder.AddSpacer(body, 2);
        WordDocumentBuilder.AddBulletList(body, ["alpha", "beta"]);

        body.Elements<Paragraph>().Should().NotBeEmpty();
        body.InnerText.Should().Contain("Plain");
        body.InnerText.Should().Contain("Heading");
        body.InnerText.Should().Contain("Body copy");
        body.InnerText.Should().Contain("Block one");
        body.InnerText.Should().Contain("Block two");
        body.InnerText.Should().Contain("(empty)");
        body.InnerText.Should().Contain("line-a");
        body.InnerText.Should().Contain("line-b");
        body.InnerText.Should().Contain("\u2022 alpha");
        body.InnerText.Should().Contain("\u2022 beta");

        RunFonts? monoFont = body.Descendants<RunFonts>()
            .FirstOrDefault(f => f.Ascii?.Value == "Consolas");

        monoFont.Should().NotBeNull();
    }

    [Fact]
    public void WordDocumentBuilder_simple_table_supports_header_and_empty_noop()
    {
        Body emptyBody = new();
        WordDocumentBuilder.AddSimpleTable(emptyBody, Array.Empty<(string, string)>());
        emptyBody.Elements<Table>().Should().BeEmpty();

        Body withHeader = new();
        WordDocumentBuilder.AddSimpleTable(
            withHeader,
            [("ColA", "ColB"), ("v1", "v2")],
            headerRow: true);
        withHeader.Elements<Table>().Should().HaveCount(1);
        withHeader.Descendants<TableRow>().Should().HaveCount(2);
        withHeader.InnerText.Should().Contain("ColA").And.Contain("v1");

        Body withoutHeader = new();
        WordDocumentBuilder.AddSimpleTable(withoutHeader, [("k", "v")], headerRow: false);
        withoutHeader.Descendants<TableRow>().Should().HaveCount(1);
        withoutHeader.Descendants<Shading>().Should().BeEmpty();
    }

    [Fact]
    public void WordDocumentBuilder_adds_three_and_four_column_tables()
    {
        Body body = new();

        WordDocumentBuilder.AddThreeColumnTable(
            body,
            [("a1", "a2", "a3")],
            ("H1", "H2", "H3"));
        WordDocumentBuilder.AddFourColumnTable(
            body,
            ("A", "B", "C", "D"),
            [("w", "x", "y", "z")]);

        body.Elements<Table>().Should().HaveCount(2);
        body.InnerText.Should().Contain("H1").And.Contain("a3").And.Contain("D").And.Contain("z");
    }

    [Fact]
    public void WordDocumentBuilder_issues_table_bolds_high_severity()
    {
        Body body = new();
        ManifestIssue[] issues =
        [
            new ManifestIssue
            {
                IssueType = "Finding",
                Title = "Critical gap",
                Description = "Missing control",
                Severity = "CRITICAL",
            },
            new ManifestIssue
            {
                IssueType = "Finding",
                Title = "High risk",
                Description = "Exposure",
                Severity = "HIGH",
            },
            new ManifestIssue
            {
                IssueType = "Finding",
                Title = "Info note",
                Description = "Advisory",
                Severity = "LOW",
            },
        ];

        WordDocumentBuilder.AddIssuesTable(body, issues);

        Table table = body.Elements<Table>().Should().ContainSingle().Subject;
        table.Descendants<TableRow>().Should().HaveCount(4);

        List<Run> highSeverityRuns = table.Descendants<Run>()
            .Where(r => r.InnerText == "CRITICAL" || r.InnerText == "HIGH")
            .ToList();

        highSeverityRuns.Should().HaveCount(2);

        foreach (Run run in highSeverityRuns)
        {
            run.RunProperties.Should().NotBeNull();
            run.RunProperties!.Bold.Should().NotBeNull();
            run.RunProperties.Color.Should().NotBeNull();
            run.RunProperties.Color!.Val!.Value.Should().Be("C00000");
        }

        Run lowSeverityRun = table.Descendants<Run>().Single(r => r.InnerText == "LOW");
        lowSeverityRun.RunProperties.Should().BeNull();
    }

    [Fact]
    public void TechnologyLedgerProseTokenCatalog_exposes_curated_tokens()
    {
        TechnologyLedgerProseTokenCatalog.AllTokens.Should().NotBeEmpty();
        TechnologyLedgerProseTokenCatalog.AllTokens.Should()
            .Contain(t => t.ProviderFamily == CloudProvider.Azure && t.Token == "Key Vault");
        TechnologyLedgerProseTokenCatalog.AllTokens.Should()
            .Contain(t => t.ProviderFamily == CloudProvider.Aws && t.Token == "Lambda");
        TechnologyLedgerProseTokenCatalog.AllTokens.Should()
            .Contain(t => t.ProviderFamily == CloudProvider.Gcp && t.Token == "BigQuery");
    }

    private static ResolvedArchitectureDecision CreateDecision(
        string title,
        string selectedOption,
        string rationale)
    {
        return new ResolvedArchitectureDecision
        {
            Category = "Cost",
            Title = title,
            SelectedOption = selectedOption,
            Rationale = rationale,
        };
    }
}
