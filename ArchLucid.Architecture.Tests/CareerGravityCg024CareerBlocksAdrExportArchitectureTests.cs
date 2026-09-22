using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-024 ratchet: ADR export uses career artifact validator with door stamp; rehearsal header or hard block.
/// Does not reopen FC ADR export body.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg024CareerBlocksAdrExportArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg024_adr_modal_resolves_door_stamp_for_career_artifact_validator()
    {
        string modal = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GenerateAdrFromRunModal.tsx"));
        string helper = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "career-artifact",
                "resolve-career-artifact-export-honesty-input.ts"));

        modal.Should().Contain("resolveCareerArtifactExportHonestyDoorFields");
        modal.Should().Contain("resolveSimulatorRehearsalBannerOnArtifactForExport");
        modal.Should().Contain("evaluateCareerArtifactHonesty");
        modal.Should().Contain("generate-adr-career-artifact-gap");
        helper.Should().Contain("resolveSimulatorRehearsalBannerOnArtifactForExport");
    }

    [Fact]
    public void Cg024_adr_export_prepends_rehearsal_header_markdown()
    {
        string formatter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "career-artifact",
                "format-career-adr-export-rehearsal-header-markdown.ts"));
        string modal = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GenerateAdrFromRunModal.tsx"));

        formatter.Should().Contain("formatCareerAdrExportRehearsalHeaderMarkdown");
        formatter.Should().Contain("resolvePackagePrintRehearsalHonestyStrip");
        modal.Should().Contain("formatCareerAdrExportRehearsalHeaderMarkdown");
    }

    [Fact]
    public void Cg024_adr_modal_hard_blocks_simulator_career_without_confirm_bypass()
    {
        string modal = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GenerateAdrFromRunModal.tsx"));

        modal.Should().Contain("careerSimulatorHardBlocked");
        modal.Should().Contain("SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON");
    }

    [Fact]
    public void Cg024_docs_record_adr_export_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-024");
        docs.Should().Contain("ADR");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
