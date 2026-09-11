using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-027 ratchet: CLI proof-packet bundle blocks unlabeled Working Career Simulator and stamps REHEARSAL in manifest.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg027CareerBlocksCliExportBundleArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg027_write_folder_resolves_export_bundle_career_posture_gate()
    {
        string writer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "PilotProofPacketCommand.WriteFolder.cs"));

        writer.Should().Contain("ExportBundleCareerPostureResolver.ResolveFromDeltasJson");
        writer.Should().Contain("PilotProofPacketArtifactManifestBuilder.BuildJson");
    }

    [Fact]
    public void Cg027_resolver_reuses_simulator_career_honesty_presenter()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "ExportBundleCareerPostureResolver.cs"));

        resolver.Should().Contain("SimulatorCareerHonestyPresenter.ShouldBlockWorkingCareer");
        resolver.Should().Contain("CareerPostureRehearsal");
        resolver.Should().Contain("workingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg027_pilot_run_deltas_response_includes_execute_posture_fields()
    {
        string contract = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Pilots", "PilotRunDeltasResponse.cs"));

        contract.Should().Contain("StructuralExecutionMode");
        contract.Should().Contain("WorkingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg027_docs_record_cli_bundle_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-027");
        docs.Should().Contain("proof-packet");
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
