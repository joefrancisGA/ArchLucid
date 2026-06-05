using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlDecisionTraceRepository.GetByIdAsync" /> scope isolation (TB-301).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlDecisionTraceRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1"),
        WorkspaceId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2"),
        ProjectId = Guid.Parse("e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_trace_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            runId,
            "scope-iso-dt",
            CancellationToken.None);

        SqlDecisionTraceRepository repository = new(new TestSqlConnectionFactory(fixture.ConnectionString));

        DecisionTraceDto trace = RuleAuditTraceDto.From(new RuleAuditTracePayload
        {
            TenantId = ScopeA.TenantId,
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
            DecisionTraceId = traceId,
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            RuleSetId = "rs-scope-iso",
            RuleSetVersion = "1",
            RuleSetHash = "h",
            AppliedRuleIds = ["r1"],
            AcceptedFindingIds = [],
            RejectedFindingIds = [],
            Notes = ["n1"],
        });

        await repository.SaveAsync(trace, CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
        };

        DecisionTraceDto? leaked = await repository.GetByIdAsync(scopeB, traceId, CancellationToken.None);

        leaked.Should().BeNull("decision trace reads must not resolve under a different tenant scope.");

        DecisionTraceDto? owned = await repository.GetByIdAsync(ScopeA, traceId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
