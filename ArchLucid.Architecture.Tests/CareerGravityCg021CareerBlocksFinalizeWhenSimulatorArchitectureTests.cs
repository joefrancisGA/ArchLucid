using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-021 ratchet: Career door + Simulator/Fallback cannot finalize; Rehearsal door may seal as rehearsal-incomplete (LP-06).
/// Extends existing ADR 0078 validators — does not fork FC or flip host Mode.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg021CareerBlocksFinalizeWhenSimulatorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg021_server_mapper_passes_working_door_stamp_into_finalize_validator()
    {
        string mapper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "CareerArtifactCompletenessInputMapper.cs"));
        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));
        string presenter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "CareerArtifacts", "SimulatorCareerHonestyPresenter.cs"));

        mapper.Should().Contain("workingCareerRehearsalDoor");
        orchestrator.Should().Contain("workingCareerRehearsalDoor: runRecord.WorkingCareerRehearsalDoor");
        presenter.Should().Contain("WorkingCareerRehearsalDoorValues.Rehearsal");
    }

    [Fact]
    public void Cg021_ui_finalize_blocked_honesty_splits_ready_label_from_finalize_mutation()
    {
        string finalizeHonesty = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-pipeline-finalize-blocked-honesty.ts"));
        string simulatorHonesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "simulator-career-honesty.ts"));

        finalizeHonesty.Should().Contain("shouldBlockFinalizeForCareerHonesty");
        finalizeHonesty.Should().Contain("allowsLp06RehearsalSimulatorFinalize");
        finalizeHonesty.Should().Contain("resolveCareerFinalizeBlockedReason");
        simulatorHonesty.Should().Contain("effectiveWorkingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg021_docs_record_career_simulator_finalize_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-021");
        docs.Should().Contain("Career door");
        docs.Should().Contain("Simulator");
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
