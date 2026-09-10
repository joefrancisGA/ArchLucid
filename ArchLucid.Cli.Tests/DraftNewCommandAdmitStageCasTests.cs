using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftNewCommandAdmitStageCasTests
{
    [Fact]
    public void admit_stage_patch_sends_expected_updated_utc_from_create_response()
    {
        string repoRoot = FindRepoRoot();
        string sourcePath = Path.Combine(repoRoot, "ArchLucid.Cli", "Commands", "DraftNewCommandAdmitStage.cs");
        string source = File.ReadAllText(sourcePath);

        source.Should().Contain("ExpectedUpdatedUtc = created.Value.UpdatedUtc");
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
