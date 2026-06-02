using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-009: mutating HTTP actions use durable <c>Idempotency-Key</c> replay protection.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MutatingHttpIdempotencyArchitectureTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void Idempotency_filter_persists_replay_records()
    {
        string root = FindRepoRoot();
        string filterPath = Path.Combine(root, "ArchLucid.Api", "Controllers", "Authority", "IdempotencyFilterAttribute.cs");
        File.Exists(filterPath).Should().BeTrue();
        string filterText = File.ReadAllText(filterPath);

        filterText.Should().Contain("IIdempotencyRecordRepository");
        filterText.Should().Contain("Idempotency-Key");
        filterText.Should().Contain("X-Idempotency-Replayed");
    }

    [Fact]
    public void Authority_mutating_controllers_apply_IdempotencyFilter()
    {
        string root = FindRepoRoot();

        string runsPath = Path.Combine(root, "ArchLucid.Api", "Controllers", "Authority", "RunsController.cs");
        File.Exists(runsPath).Should().BeTrue();
        string runsText = File.ReadAllText(runsPath);
        runsText.Should().Contain("[IdempotencyFilter]");

        string queryPath = Path.Combine(root, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.cs");
        File.Exists(queryPath).Should().BeTrue();
        string queryText = File.ReadAllText(queryPath);
        queryText.Should().Contain("[IdempotencyFilter]");
    }

    [Fact]
    public void Idempotency_records_migration_and_repository_exist()
    {
        string root = FindRepoRoot();

        string migrationPath = Path.Combine(root, "ArchLucid.Persistence", "Migrations", "198_IdempotencyRecords.sql");
        File.Exists(migrationPath).Should().BeTrue();

        string repoPath = Path.Combine(root, "ArchLucid.Persistence", "Data", "Repositories", "IdempotencyRecordRepository.cs");
        File.Exists(repoPath).Should().BeTrue();

        string compositionPath = Path.Combine(root, "ArchLucid.Host.Composition", "Startup", "ServiceCollectionExtensions.CoordinatorAndArtifacts.cs");
        File.Exists(compositionPath).Should().BeTrue();
        string compositionText = File.ReadAllText(compositionPath);
        compositionText.Should().Contain("IIdempotencyRecordRepository");
    }
}
