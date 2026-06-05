using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlGoldenManifestRepository.GetByIdAsync" /> scope isolation (TB-301).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlGoldenManifestRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1"),
        WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"),
        ProjectId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_manifest_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.SeedFullChainAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            "scope-iso-gm",
            CancellationToken.None);

        SqlGoldenManifestRepository repository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(new TestSqlConnectionFactory(fixture.ConnectionString));

        ManifestDocument manifest = new()
        {
            TenantId = ScopeA.TenantId,
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "scope-iso-hash",
            RuleSetId = "rs-scope-iso",
            RuleSetVersion = "1",
            RuleSetHash = "rsh-scope-iso",
            Metadata = new ManifestMetadata { Name = "Scope isolation manifest" },
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = ["a1"],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = [],
        };

        await repository.SaveAsync(manifest, CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
        };

        ManifestDocument? leaked = await repository.GetByIdAsync(scopeB, manifestId, CancellationToken.None);

        leaked.Should().BeNull("golden manifest reads must not resolve under a different tenant scope.");

        ManifestDocument? owned = await repository.GetByIdAsync(ScopeA, manifestId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
