using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-071 ratchet: career JSON, ADR, and print exports carry semantic support band + scorer version.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs071ExportJsonIncludesBandArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As071_ui_export_module_exposes_band_and_scorer_version_helpers()
    {
        string exportModule = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-semantic-support-band-export.ts"));

        exportModule.Should().Contain("FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION");
        exportModule.Should().Contain("resolveFindingSemanticSupportBandExportFields");
        exportModule.Should().Contain("buildSemanticSupportBandExportStamp");
        exportModule.Should().Contain("formatCareerExportSemanticSupportBandMarkdownSection");
    }

    [Fact]
    public void As071_career_export_honesty_includes_semantic_support_markdown_section()
    {
        string careerHonesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "career-export-coverage-honesty.ts"));

        careerHonesty.Should().Contain("formatCareerExportSemanticSupportBandMarkdownSection");
    }

    [Fact]
    public void As071_findings_itsm_json_export_includes_semantic_support_band_stamp()
    {
        string itsmExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-findings-itsm-export.ts"));

        itsmExport.Should().Contain("semanticSupportBandStamp");
        itsmExport.Should().Contain("buildSemanticSupportBandExportStamp");
    }

    [Fact]
    public void As071_decision_register_export_includes_semantic_support_band_stamp()
    {
        string decisionRegisterExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "decision-register-export.ts"));

        decisionRegisterExport.Should().Contain("semanticSupportBandStamp");
        decisionRegisterExport.Should().Contain("supportingFindingSemanticSupportBands");
    }

    [Fact]
    public void As071_print_view_exposes_semantic_support_stamp_line()
    {
        string printView = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "package-print-view.ts"));

        printView.Should().Contain("semanticSupportBandStampLine");
        printView.Should().Contain("resolvePackagePrintSemanticSupportBandStampLine");
    }

    [Fact]
    public void As071_adr_markdown_includes_semantic_support_per_finding()
    {
        string adrMarkdown = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "adr-from-run-markdown.ts"));

        adrMarkdown.Should().Contain("Semantic support");
        adrMarkdown.Should().Contain("semanticSupportBandScorerVersion");
    }

    [Fact]
    public void As071_career_export_composer_includes_semantic_support_markdown_formatter()
    {
        string composer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Exports",
                "CareerExportCoverageHonestyComposer.cs"));

        composer.Should().Contain("CareerExportSemanticSupportBandMarkdownFormatter");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
