using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlAzureExtractorPackageRepository.GetWorkspaceBaselineArtifactsAsync" />
///     project scope isolation.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectWithPackageId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid ProjectWithoutPackageId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");

    [SkippableFact]
    public async Task GetWorkspaceBaselineArtifacts_foreign_project_package_does_not_mark_current_project_as_having_baseline()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlAzureExtractorPackageRepository repository = new(factory);

        AzureExtractorPackageRecord foreignProjectPackage = new()
        {
            PackageId = Guid.NewGuid(),
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectWithPackageId,
            CreatedUtc = DateTime.UtcNow,
            SchemaVersion = 1,
            ScriptVersion = "2.4.1",
            CollectionTimestampUtc = DateTime.UtcNow,
            OriginalFileName = "foreign-project.zip",
            ManifestJson = "{}",
            PackageBytes = [0x50, 0x4B],
        };

        await repository.InsertAsync(foreignProjectPackage, CancellationToken.None);

        ScopeContext currentProjectScope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectWithoutPackageId,
        };

        WorkspaceBaselineExtractorArtifacts artifacts =
            await repository.GetWorkspaceBaselineArtifactsAsync(currentProjectScope, CancellationToken.None);

        artifacts.HasAnyInWorkspace.Should().BeFalse(
            "baseline presence must be project-scoped so sibling-project packages do not return (true, null).");

        artifacts.LatestScriptVersion.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryGetLatestProvenanceByRunId_preserves_stored_utc_creation_time()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlAzureExtractorPackageRepository repository = new(factory);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        await AuthorityRunChainTestSeed.SeedFullChainAsync(
            connection,
            TenantId,
            WorkspaceId,
            ProjectWithPackageId,
            runId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "proj-package-provenance-utc",
            CancellationToken.None);

        DateTime createdUtc = new(2026, 1, 15, 12, 34, 56, DateTimeKind.Utc);
        await repository.InsertAsync(new AzureExtractorPackageRecord
        {
            PackageId = Guid.NewGuid(),
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectWithPackageId,
            RunId = runId,
            CreatedUtc = createdUtc,
            SchemaVersion = 1,
            OriginalFileName = "provenance.zip",
            ManifestJson = "{}",
            PackageBytes = [0x50, 0x4B],
        }, CancellationToken.None);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectWithPackageId };
        AzureExtractorPackageProvenance? provenance =
            await repository.TryGetLatestProvenanceByRunIdAsync(scope, runId, CancellationToken.None);

        provenance.Should().NotBeNull();
        provenance!.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
        provenance!.CreatedUtc.Ticks.Should().Be(createdUtc.Ticks);
    }
}
