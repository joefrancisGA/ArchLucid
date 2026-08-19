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
        bool? dirty = DeploymentEvidenceGitReader.TryReadDirty(Environment.CurrentDirectory);

        if (dirty is null)
            return;

        dirty.Should().BeFalse();
    }
}
