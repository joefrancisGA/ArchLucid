using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentStatusOptionsTests
{
    [Fact]
    public void DeploymentStatusOptions_Defaults_AreUnset()
    {
        DeploymentStatusOptions options = new();

        DeploymentStatusOptions.SectionPath.Should().Be("DeploymentStatus");
        options.GitHubCommitUrlTemplate.Should().BeNull();
        options.GitHubWorkflowRunUrlTemplate.Should().BeNull();
        options.LatestGitHubWorkflowRunId.Should().BeNull();
        options.AzureResourceOverviewUrl.Should().BeNull();
        options.LogsUrl.Should().BeNull();
        options.MonitoringUrl.Should().BeNull();
        options.WorkerBuildCommitSha.Should().BeNull();
        options.LastKnownGoodBuildId.Should().BeNull();
        options.LatestSmokeTestResult.Should().BeNull();
    }

    [Fact]
    public void DeploymentStatusOptions_RoundTripsEveryLinkAndIdentityOverride()
    {
        DeploymentStatusOptions options = new()
        {
            GitHubCommitUrlTemplate = "https://github.com/org/repo/commit/{commitSha}",
            GitHubWorkflowRunUrlTemplate = "https://github.com/org/repo/actions/runs/{runId}",
            LatestGitHubWorkflowRunId = "998877",
            AzureResourceOverviewUrl = "https://portal.azure.com/#resource/overview",
            LogsUrl = "https://portal.azure.com/#logs",
            MonitoringUrl = "https://portal.azure.com/#monitoring",
            WorkerBuildCommitSha = "abc1234",
            LastKnownGoodBuildId = "build-42",
            LatestSmokeTestResult = "Passed",
        };

        options.GitHubCommitUrlTemplate.Should().Be("https://github.com/org/repo/commit/{commitSha}");
        options.GitHubWorkflowRunUrlTemplate.Should().Be("https://github.com/org/repo/actions/runs/{runId}");
        options.LatestGitHubWorkflowRunId.Should().Be("998877");
        options.AzureResourceOverviewUrl.Should().Be("https://portal.azure.com/#resource/overview");
        options.LogsUrl.Should().Be("https://portal.azure.com/#logs");
        options.MonitoringUrl.Should().Be("https://portal.azure.com/#monitoring");
        options.WorkerBuildCommitSha.Should().Be("abc1234");
        options.LastKnownGoodBuildId.Should().Be("build-42");
        options.LatestSmokeTestResult.Should().Be("Passed");
    }
}
