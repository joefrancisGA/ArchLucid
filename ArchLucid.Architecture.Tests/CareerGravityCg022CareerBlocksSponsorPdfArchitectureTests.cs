using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-022 ratchet: sponsor PDF export blocks unwatermarked Working Career Simulator paths.
/// Rehearsal door may export with rehearsal labeling (LP-06). Does not reopen FC sponsor export body.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg022CareerBlocksSponsorPdfArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg022_map_for_export_is_door_stamp_aware_not_mode_assumed_banner()
    {
        string mapper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "CareerArtifactCompletenessInputMapper.cs"));
        string loader = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "CareerExportCoverageHonestyMaterialLoader.cs"));

        mapper.Should().Contain("ResolveSimulatorRehearsalBannerOnArtifactForExport");
        mapper.Should().Contain("WorkingCareerRehearsalDoor: input.WorkingCareerRehearsalDoor");
        mapper.Should().Contain("WorkingCareerRehearsalDoorValues.Rehearsal");
        loader.Should().Contain("detail.Run.WorkingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg022_sponsor_pdf_gate_reads_career_artifact_block_from_first_value_report()
    {
        string gate = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "SponsorFirstValuePdfGate.cs"));
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "FirstValueReportBuilder.cs"));

        gate.Should().Contain("CareerArtifactBlockedReason");
        builder.Should().Contain("CareerArtifactExportCompletenessGate.ResolveBlock");
        builder.Should().Contain("MapForExport");
    }

    [Fact]
    public void Cg022_ui_sponsor_banner_resolves_door_stamp_for_career_honesty()
    {
        string hook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));
        string helper = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "career-artifact",
                "resolve-career-artifact-export-honesty-input.ts"));

        hook.Should().Contain("resolveCareerArtifactExportHonestyDoorFields");
        hook.Should().Contain("blockSponsorPdfForCareerArtifact");
        helper.Should().Contain("resolveHonestyWorkingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg022_docs_record_sponsor_pdf_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-022");
        docs.Should().Contain("sponsor PDF");
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
