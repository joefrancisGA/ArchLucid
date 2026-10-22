using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="DapperAuditRepository.GetFilteredAsync" /> tenant isolation (TB-301).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperAuditRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantA = Guid.Parse("c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1");
    private static readonly Guid WorkspaceA = Guid.Parse("c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2");
    private static readonly Guid ProjectA = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    [SkippableFact]
    public async Task GetFilteredAsync_wrong_scope_returns_empty_when_events_exist_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperAuditRepository repository = new(
            connectionFactory,
            new TestReadOnlyDbConnectionFactory(connectionFactory));

        Guid runId = Guid.NewGuid();

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TenantA,
            WorkspaceA,
            ProjectA,
            runId,
            ProjectA.ToString("D"),
            CancellationToken.None);

        AuditEvent evt = new()
        {
            EventId = Guid.NewGuid(),
            OccurredUtc = TimeProvider.System.UtcNowDateTime(),
            EventType = "ScopeIsolationAuditTb301",
            ActorUserId = "actor-a",
            ActorUserName = "Actor A",
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
            RunId = runId,
            DataJson = "{}",
        };

        await repository.AppendAsync(evt, CancellationToken.None);

        Guid tenantB = Guid.NewGuid();
        AuditEventFilter filter = new() { RunId = runId, Take = 50 };

        IReadOnlyList<AuditEvent> leaked =
            await repository.GetFilteredAsync(tenantB, WorkspaceA, ProjectA, filter, CancellationToken.None);

        leaked.Should().BeEmpty("audit search must not return rows when the tenant predicate does not match.");

        IReadOnlyList<AuditEvent> owned =
            await repository.GetFilteredAsync(TenantA, WorkspaceA, ProjectA, filter, CancellationToken.None);

        owned.Should().Contain(x => x.EventId == evt.EventId);
    }

    [SkippableFact]
    public async Task GetFilteredAsync_event_type_filter_and_count_match_scoped_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperAuditRepository repository = new(
            connectionFactory,
            new TestReadOnlyDbConnectionFactory(connectionFactory));

        Guid runId = Guid.NewGuid();
        const string matchingEventType = "ScopeIsolationAuditTb301Typed";
        const string otherEventType = "ScopeIsolationAuditTb301Other";

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TenantA,
            WorkspaceA,
            ProjectA,
            runId,
            ProjectA.ToString("D"),
            CancellationToken.None);

        AuditEvent matching = new()
        {
            EventId = Guid.NewGuid(),
            OccurredUtc = TimeProvider.System.UtcNowDateTime(),
            EventType = matchingEventType,
            ActorUserId = "actor-a",
            ActorUserName = "Actor A",
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
            RunId = runId,
            DataJson = "{}",
        };

        AuditEvent other = new()
        {
            EventId = Guid.NewGuid(),
            OccurredUtc = TimeProvider.System.UtcNowDateTime(),
            EventType = otherEventType,
            ActorUserId = "actor-a",
            ActorUserName = "Actor A",
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
            RunId = runId,
            DataJson = "{}",
        };

        await repository.AppendAsync(matching, CancellationToken.None);
        await repository.AppendAsync(other, CancellationToken.None);

        AuditEventFilter filter = new() { RunId = runId, EventType = matchingEventType, Take = 50 };

        IReadOnlyList<AuditEvent> filtered =
            await repository.GetFilteredAsync(TenantA, WorkspaceA, ProjectA, filter, CancellationToken.None);

        filtered.Should().ContainSingle(x => x.EventId == matching.EventId);

        int count =
            await repository.CountFilteredAsync(TenantA, WorkspaceA, ProjectA, filter, CancellationToken.None);

        count.Should().Be(1);
    }
}
