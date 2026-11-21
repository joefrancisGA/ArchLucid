using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Governance;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ComplianceDriftFindingsTrendReaderSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task GetBucketCountsAsync_respects_a_fractional_bucket_origin()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        TestReadOnlyDbConnectionFactory readOnlyFactory = new(connectionFactory);
        DapperAuditRepository auditRepository = new(connectionFactory, readOnlyFactory);
        DapperComplianceDriftFindingsTrendReader reader = new(readOnlyFactory);
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime fromUtc = new DateTime(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc).AddMilliseconds(750);
        TimeSpan bucketSize = TimeSpan.FromHours(1);
        DateTime boundaryUtc = fromUtc + bucketSize;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            tenantId,
            workspaceId,
            projectId,
            runId,
            projectId.ToString("D"),
            CancellationToken.None);

        await AppendAsync(boundaryUtc.AddMilliseconds(-250), AuditEventTypes.FindingsSnapshotSealed);
        await AppendAsync(boundaryUtc, AuditEventTypes.FindingReviewApproved);

        var counts = await reader.GetBucketCountsAsync(
            tenantId,
            workspaceId,
            projectId,
            fromUtc,
            boundaryUtc + bucketSize,
            bucketSize,
            CancellationToken.None);

        counts.Should().HaveCount(2);
        counts.Should().ContainKey(fromUtc);
        counts.Should().ContainKey(boundaryUtc);
        counts[fromUtc].OpenFindingsCount.Should().Be(1);
        counts[fromUtc].ResolvedFindingsCount.Should().Be(0);
        counts[boundaryUtc].OpenFindingsCount.Should().Be(0);
        counts[boundaryUtc].ResolvedFindingsCount.Should().Be(1);

        Task AppendAsync(DateTime occurredUtc, string eventType) =>
            auditRepository.AppendAsync(
                new AuditEvent
                {
                    EventId = Guid.NewGuid(),
                    OccurredUtc = occurredUtc,
                    EventType = eventType,
                    ActorUserId = "actor",
                    ActorUserName = "Actor",
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RunId = runId,
                    DataJson = "{}",
                },
                CancellationToken.None);
    }
}
