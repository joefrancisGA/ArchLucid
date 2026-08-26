using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

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
}
