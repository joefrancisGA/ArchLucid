using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-323: idempotency contract harness stays wired for core mutating endpoints.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MutatingIdempotencyContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Idempotency_contract_integration_tests_exist()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "MutatingEndpointIdempotencyContractIntegrationTests.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);
        text.Should().Contain("CreateRun_same_idempotency_key_replays_without_duplicate_run_rows");
        text.Should().Contain("CommitRun_same_idempotency_key_replays_without_new_manifest_version");
        text.Should().Contain("Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id");
    }

    [Fact]
    public void Idempotency_baseline_fixture_includes_core_mutating_routes()
    {
        string path = Path.Combine(RepoRoot, "scripts", "ci", "fixtures", "mutating_route_idempotency_baseline.json");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);
        text.Should().Contain("POST /v1/architecture/request");
        text.Should().Contain("POST /v1/architecture/review/{runId}/finalize");
        text.Should().Contain("POST /v1/governance/approval-requests");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
