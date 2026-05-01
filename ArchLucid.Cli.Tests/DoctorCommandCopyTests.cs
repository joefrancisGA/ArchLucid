using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>
///     Guards doctor footer copy stays aligned with the pilot rescue playbook path (support-bundle uses the same link).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DoctorCommandCopyTests
{
    [Fact]
    public void DoctorCommand_source_embeds_pilot_rescue_playbook_constant()
    {
        string root = RepoRootDirectory();
        string path = Path.Combine(root, "ArchLucid.Cli", "Commands", "DoctorCommand.cs");
        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);
        source.Should().Contain("Stuck mid-pilot?");
        source.Should().Contain(
            nameof(SupportBundleDocLinks.PilotRescuePlaybookRelativePath),
            because: "doctor footer must use the shared path constant from SupportBundleDocLinks");
    }

    private static string RepoRootDirectory()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");
            if (File.Exists(sln))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not resolve repository root from test base directory.");
    }
}
