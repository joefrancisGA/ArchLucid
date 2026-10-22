using ArchLucid.Application.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestMutateStageCasForwardTests
{
    [Fact]
    public void PatchAsync_source_forwards_expected_updated_utc_and_force_overwrite_into_the_guard()
    {
        string repoRoot = FindRepoRoot();
        string sourcePath = Path.Combine(repoRoot, "ArchLucid.Application", "Drafts", "Stages", "DraftRequestMutateStage.cs");
        string source = File.ReadAllText(sourcePath);

        source.Should().Contain("DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow");
        source.Should().Contain("patch.ExpectedUpdatedUtc");
        source.Should().Contain("patch.ForceOverwrite == true");
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

        throw new InvalidOperationException("Could not locate repository root from the test working directory.");
    }
}
