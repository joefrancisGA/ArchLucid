using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
public sealed class CliCommandSharedTests
{
    [Fact]
    public void ParseCloudProvider_null_or_whitespace_returns_Azure()
    {
        CliCommandShared.ParseCloudProvider(null).Should().Be(CloudProvider.Azure);
        CliCommandShared.ParseCloudProvider("   ").Should().Be(CloudProvider.Azure);
    }

    [Fact]
    public void ParseCloudProvider_non_empty_maps_to_Azure()
    {
        CliCommandShared.ParseCloudProvider("AWS").Should().Be(CloudProvider.Azure);
    }

    [Fact]
    public void BuildArchitectureRequest_maps_architecture_section()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            ProjectName = "Sys",
            Architecture = new ArchLucidProjectScaffolder.ArchitectureSection
            {
                Environment = "staging",
                CloudProvider = "Azure",
                Constraints = ["c1"],
                RequiredCapabilities = ["cap"],
                Assumptions = ["a1"],
                PriorManifestVersion = "v9"
            }
        };

        ArchitectureRequest request = CliCommandShared.BuildArchitectureRequest(config, "brief body");

        request.SystemName.Should().Be("Sys");
        request.Description.Should().Be("brief body");
        request.Environment.Should().Be("staging");
        request.Constraints.Should().Equal("c1");
        request.RequiredCapabilities.Should().Equal("cap");
        request.Assumptions.Should().Equal("a1");
        request.PriorManifestVersion.Should().Be("v9");
    }

    [Fact]
    public void BuildArchitectureRequest_without_architecture_uses_prod_defaults()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new() { ProjectName = "P" };

        ArchitectureRequest request = CliCommandShared.BuildArchitectureRequest(config, "x");

        request.Environment.Should().Be("prod");
        request.Constraints.Should().BeEmpty();
        request.RequiredCapabilities.Should().BeEmpty();
        request.Assumptions.Should().BeEmpty();
    }

    [Fact]
    public void WriteRunSummary_writes_expected_json_shape()
    {
        string path = Path.Combine(
            Path.GetTempPath(),
            "ArchLucid.Cli.Tests.runsummary." + Guid.NewGuid().ToString("N") + ".json");

        try
        {
            List<ArchLucidApiClient.AgentTaskInfo> tasks =
            [
                new()
                {
                    TaskId = "t1",
                    RunId = "run-1",
                    Objective = "obj",
                    AgentType = AgentType.Topology,
                    Status = AgentTaskStatus.Created
                }
            ];

            DateTime created = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
            CliCommandShared.WriteRunSummary(
                path,
                "http://localhost/",
                "run-1",
                "req-1",
                ArchitectureRunStatus.TasksGenerated,
                created,
                tasks,
                "mv1");

            File.Exists(path).Should().BeTrue();
            string json = File.ReadAllText(path);
            json.Should().Contain("run-1");
            json.Should().Contain("req-1");
            json.Should().Contain("t1");
            json.Should().Contain("manifest/mv1");
        }
        finally
        {
            if (File.Exists(path))
                File.Delete(path);
        }
    }

    [Fact]
    public void ExitCodeForFailedConnection_maps_invalid_configuration_and_unreachable()
    {
        CliCommandShared.ExitCodeForFailedConnection(ApiConnectionOutcome.InvalidConfiguration)
            .Should()
            .Be(CliExitCode.ConfigurationError);

        CliCommandShared.ExitCodeForFailedConnection(ApiConnectionOutcome.Unreachable)
            .Should()
            .Be(CliExitCode.ApiUnavailable);
    }

    [Fact]
    public void ExitCodeForFailedConnection_throws_for_connected_outcome()
    {
        Action act = () => CliCommandShared.ExitCodeForFailedConnection(ApiConnectionOutcome.Connected);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void TryGetOptionValue_returns_following_token_or_null()
    {
        CliCommandShared.TryGetOptionValue(["--run-id", "abc", "--json"], "--run-id").Should().Be("abc");
        CliCommandShared.TryGetOptionValue(["--json"], "--run-id").Should().BeNull();
        CliCommandShared.TryGetOptionValue([], "--run-id").Should().BeNull();
    }

    [Fact]
    public async Task TryConnectToApiAsync_invalid_url_returns_invalid_configuration()
    {
        bool previousJson = CliExecutionContext.JsonOutput;

        try
        {
            CliExecutionContext.JsonOutput = false;

            ApiConnectionOutcome outcome =
                await CliCommandShared.TryConnectToApiAsync("not-a-valid-url", ct: CancellationToken.None);

            outcome.Should().Be(ApiConnectionOutcome.InvalidConfiguration);
        }
        finally
        {
            CliExecutionContext.JsonOutput = previousJson;
        }
    }

    [Fact]
    public async Task TryConnectToApiAsync_unreachable_host_returns_unreachable()
    {
        bool previousJson = CliExecutionContext.JsonOutput;

        try
        {
            CliExecutionContext.JsonOutput = false;

            ApiConnectionOutcome outcome =
                await CliCommandShared.TryConnectToApiAsync("http://127.0.0.1:1", ct: CancellationToken.None);

            outcome.Should().Be(ApiConnectionOutcome.Unreachable);
        }
        finally
        {
            CliExecutionContext.JsonOutput = previousJson;
        }
    }

    [Fact]
    public void WriteRunSummary_without_manifest_version_omits_artifact_uris()
    {
        string path = Path.Combine(
            Path.GetTempPath(),
            "ArchLucid.Cli.Tests.runsummary." + Guid.NewGuid().ToString("N") + ".json");

        try
        {
            CliCommandShared.WriteRunSummary(
                path,
                "http://localhost/",
                "run-1",
                "req-1",
                ArchitectureRunStatus.TasksGenerated,
                DateTime.UtcNow,
                [],
                manifestVersion: null);

            string json = File.ReadAllText(path);

            json.Should().Contain("\"artifactUris\": []");
            json.Should().Contain("\"manifestVersion\": null");
        }
        finally
        {
            if (File.Exists(path))
                File.Delete(path);
        }
    }

    [Fact]
    public void TryLoadConfigFromCwd_without_manifest_returns_null()
    {
        using TempDirectory temp = new();

        CliTestWorkingDirectory.EnsureReadableUsingExistingDirectory(temp.Path);

        string previous = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(temp.Path);

            ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();

            config.Should().BeNull();
        }
        finally
        {
            Directory.SetCurrentDirectory(previous);
        }
    }

    private sealed class TempDirectory : IDisposable
    {
        public TempDirectory()
        {
            Directory.CreateDirectory(Path);
        }

        public string Path
        {
            get;
        } =
            System.IO.Path.Combine(System.IO.Path.GetTempPath(),
                "ArchLucid.Cli.Tests." + Guid.NewGuid().ToString("N")[..8]);

        public void Dispose()
        {
            Directory.Delete(Path, true);
        }
    }
}
