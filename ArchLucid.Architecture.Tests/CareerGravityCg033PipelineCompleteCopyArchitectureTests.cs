using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-033 ratchet: Working review-detail pipeline complete copy is stamp-gated.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg033PipelineCompleteCopyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg033_review_detail_wires_pipeline_complete_honesty_copy()
    {
        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "pipeline-complete-career-honesty-copy.ts"));
        string workspace = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "run-detail-workspace-derive", "workspace-status.ts"));
        string tracker = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "use-run-progress-tracker.ts"));

        copy.Should().Contain("WORKING_PIPELINE_REHEARSAL_COMPLETE_LABEL");
        copy.Should().Contain("Practice complete — not record-complete");
        workspace.Should().Contain("resolveWorkingPipelineCompleteReviewLabel");
        tracker.Should().Contain("resolveWorkingPipelineEngineeringCompleteStatus");
    }

    [Fact]
    public void Cg033_docs_record_pipeline_complete_copy_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-033");
        docs.Should().Contain("Pipeline complete copy honesty");
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
