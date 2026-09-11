using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-028 ratchet: run export ZIP and blob push apply Working Career completeness gate with named 409 ProblemDetails.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg028CareerBlocksApiExportArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg028_run_export_download_resolves_career_posture_gate()
    {
        string download = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.Export.Download.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.CareerPostureGuard.cs"));

        download.Should().Contain("ResolveRunExportCareerPostureBlockedResultAsync");
        guard.Should().Contain("AuditExportCareerPostureGate.ResolveForRunFilterAsync");
        guard.Should().Contain("CareerArtifactBlockedProblem");
    }

    [Fact]
    public void Cg028_run_export_push_resolves_career_posture_gate()
    {
        string push = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.Export.Push.cs"));

        push.Should().Contain("ResolveRunExportCareerPostureBlockedResultAsync");
    }

    [Fact]
    public void Cg028_openapi_documents_run_export_career_blocked_409()
    {
        string transformer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "OpenApi", "MicrosoftOpenApiCareerArtifactExportOperationTransformer.cs"));

        transformer.Should().Contain("v1/artifacts/runs/{runId}/export");
        transformer.Should().Contain("v1/artifacts/runs/{runId}/export/push");
    }

    [Fact]
    public void Cg028_docs_record_api_run_export_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-028");
        docs.Should().Contain("run export");
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
