using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-030 ratchet: Working Career review-detail surfaces suppress Ready-to-finalize when
/// Simulator/Rehearsal execute or pre-commit gate honesty applies (LP-18 residual).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg030ReadyToFinalizeLabelSuppressionArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg030_checklist_panel_uses_full_career_honesty_helper()
    {
        string panel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "PreFinalizeChecklistPanel.tsx"));

        panel.Should().Contain("shouldSuppressReadyToFinalizeForCareerHonesty");
        panel.Should().Contain("useHealthReadySummaryQuery");
        panel.Should().Contain("structuralExecutionMode");
    }

    [Fact]
    public void Cg030_honesty_strip_surfaces_simulator_career_ready_suppression()
    {
        string strip = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "RunDetailPreFinalizeGateHonestyStrip.tsx"));
        string honesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "simulator-career-honesty.ts"));

        strip.Should().Contain("shouldSuppressReadyToFinalizeForSimulatorRehearsal");
        strip.Should().Contain("run-detail-pre-finalize-simulator-career-honesty-strip");
        honesty.Should().Contain("WORKING_SIMULATOR_CAREER_READY_SUPPRESSED_TITLE");
    }

    [Fact]
    public void Cg030_docs_record_ready_label_suppression_leftover()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-030");
        docs.Should().Contain("Ready-to-finalize");
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
