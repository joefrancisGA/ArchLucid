using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch2Tests
{
    [Fact]
    public void CitationIntegrityAgentResultParser_round_trips_agent_results()
    {
        AgentResult source = new()
        {
            AgentType = AgentType.Topology,
            TaskId = "task-1",
            RunId = "run-1",
            Findings = [],
        };
        List<object> raw = [source];

        List<AgentResult> parsed = CitationIntegrityAgentResultParser.Parse(raw);

        parsed.Should().ContainSingle();
        parsed[0].AgentType.Should().Be(AgentType.Topology);
        parsed[0].TaskId.Should().Be("task-1");
    }

    [Fact]
    public void CitationIntegrityAgentResultParser_rejects_null_collection()
    {
        Action act = () => CitationIntegrityAgentResultParser.Parse(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void DeploymentEvidenceGitReader_prefers_github_sha_environment_variable()
    {
        string expected = "abc123def456";
        string? previous = Environment.GetEnvironmentVariable("GITHUB_SHA");

        try
        {
            Environment.SetEnvironmentVariable("GITHUB_SHA", expected);

            string? sha = DeploymentEvidenceGitReader.TryReadHeadSha(Environment.CurrentDirectory);

            sha.Should().Be(expected);
        }
        finally
        {
            Environment.SetEnvironmentVariable("GITHUB_SHA", previous);
        }
    }

    [Fact]
    public void DeploymentEvidenceGitReader_dirty_flag_is_false_for_clean_porcelain()
    {
        string tempRoot = Path.Combine(Path.GetTempPath(), "archlucid-cli-git-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            RunGit(tempRoot, "init");
            RunGit(tempRoot, "config user.email cli-test@archlucid.local");
            RunGit(tempRoot, "config user.name ArchLucid Cli Test");
            File.WriteAllText(Path.Combine(tempRoot, "README.md"), "clean");
            RunGit(tempRoot, "add README.md");
            RunGit(tempRoot, "commit -m \"init\"");

            bool? dirty = DeploymentEvidenceGitReader.TryReadDirty(tempRoot);

            dirty.Should().NotBeNull();
            dirty.Should().BeFalse();
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    private static void RunGit(string workingDirectory, string arguments)
    {
        System.Diagnostics.ProcessStartInfo startInfo = new()
        {
            FileName = "git",
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using System.Diagnostics.Process process = System.Diagnostics.Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start git.");

        process.WaitForExit();
        process.ExitCode.Should().Be(0, because: process.StandardError.ReadToEnd());
    }
}
