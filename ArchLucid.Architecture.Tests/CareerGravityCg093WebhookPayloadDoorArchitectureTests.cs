using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-093 ratchet: outbound webhook complete events include CG-019 execute posture fields.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg093WebhookPayloadDoorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg093_authority_run_completed_payload_stamps_career_posture()
    {
        string finalizer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "AuthorityCommittedPipelineFinalizer.cs"));

        finalizer.Should().Contain("IntegrationEventCareerHonestyPresenter.Resolve");
        finalizer.Should().Contain("careerComplete");
        finalizer.Should().Contain("workingCareerRehearsalDoor");
    }

    [Fact]
    public void Cg093_manifest_finalized_payload_stamps_career_posture()
    {
        string sql = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Finalization", "ManifestFinalizationService.Sql.cs"));
        string legacy = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Finalization", "ManifestFinalizationService.Legacy.cs"));

        sql.Should().Contain("IntegrationEventCareerHonestyPresenter.Resolve");
        legacy.Should().Contain("IntegrationEventCareerHonestyPresenter.Resolve");
    }

    [Fact]
    public void Cg093_schema_registry_requires_mode_on_complete_events()
    {
        string authoritySchema = File.ReadAllText(
            Path.Combine(RepoRoot, "schemas", "integration-events", "authority-run-completed.v1.schema.json"));
        string manifestSchema = File.ReadAllText(
            Path.Combine(RepoRoot, "schemas", "integration-events", "manifest-finalized.v1.schema.json"));

        authoritySchema.Should().Contain("structuralExecutionMode");
        authoritySchema.Should().Contain("careerComplete");
        manifestSchema.Should().Contain("workingCareerRehearsalDoor");
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
