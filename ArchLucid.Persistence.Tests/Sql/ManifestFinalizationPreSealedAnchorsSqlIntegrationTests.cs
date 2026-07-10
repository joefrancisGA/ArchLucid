using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     CI #2560: finalize when authority pipeline pre-sealed <c>GoldenManifestId</c> at request time (TB-310).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ManifestFinalizationPreSealedAnchorsSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task sp_FinalizeManifest_commits_when_anchors_pre_sealed_and_status_ready()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        Guid findingsSnapshotId = Guid.NewGuid();
        Guid artifactBundleId = Guid.NewGuid();
        string requestId = "pre-sealed-" + Guid.NewGuid().ToString("N");
        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        const string manifestVersion = "1.0.0-ci2560";

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), scope, CancellationToken.None);

        int seeded = await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET LegacyRunStatus = N'ReadyForCommit',
                GoldenManifestId = @ManifestId,
                DecisionTraceId = @DecisionTraceId,
                FindingsSnapshotId = @FindingsSnapshotId,
                ArtifactBundleId = @ArtifactBundleId,
                CurrentManifestVersion = @ManifestVersion
            WHERE RunId = @RunId;
            """,
            new
            {
                RunId = runId,
                ManifestId = manifestId,
                DecisionTraceId = decisionTraceId,
                FindingsSnapshotId = findingsSnapshotId,
                ArtifactBundleId = artifactBundleId,
                ManifestVersion = manifestVersion
            });

        seeded.Should().Be(1);

        byte[] rowVersion = await connection.QuerySingleAsync<byte[]>(
            "SELECT RowVersionStamp FROM dbo.Runs WHERE RunId = @RunId;",
            new { RunId = runId });

        DynamicParameters sp = new();
        sp.Add("@TenantId", scope.TenantId);
        sp.Add("@WorkspaceId", scope.WorkspaceId);
        sp.Add("@ScopeProjectId", scope.ProjectId);
        sp.Add("@RunId", runId);
        sp.Add("@ExpectedFindingsSnapshotId", findingsSnapshotId);
        sp.Add("@ExpectedArtifactBundleId", artifactBundleId);
        sp.Add("@ManifestId", manifestId);
        sp.Add("@DecisionTraceId", decisionTraceId);
        sp.Add("@ManifestVersion", manifestVersion);
        sp.Add("@ExpectedRowVersion", rowVersion);
        sp.Add("@ActorUserId", "e2e-admin");
        sp.Add("@ActorUserName", "e2e-admin");
        sp.Add("@AuditEventId", Guid.NewGuid());
        sp.Add("@OccurredUtc", DateTime.UtcNow);
        sp.Add("@AuditDataJson", "{}");
        sp.Add("@CorrelationId", (string?)null);
        sp.Add("@OutboxId", Guid.NewGuid());
        sp.Add("@IntegrationEventType", "ManifestFinalizedV1");
        sp.Add("@OutboxMessageId", $"{runId:N}:ManifestFinalizedV1");
        sp.Add("@OutboxPayloadUtf8", new byte[] { 0x7B, 0x7D });
        sp.Add("@OutboxPriority", 1);

        Func<Task> act = async () =>
            await connection.ExecuteAsync(
                "dbo.sp_FinalizeManifest",
                sp,
                commandType: CommandType.StoredProcedure);

        await act.Should().NotThrowAsync();

        string? status = await connection.QuerySingleOrDefaultAsync<string>(
            "SELECT LegacyRunStatus FROM dbo.Runs WHERE RunId = @RunId;",
            new { RunId = runId });

        status.Should().Be("Committed");
    }
}
