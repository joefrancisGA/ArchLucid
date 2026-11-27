using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Tests.Support;
using ArchLucid.Persistence.Transactions;

using Dapper;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests.Orchestration.AnalysisRecovery;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class SqlDependencyInvalidationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Incompatible_inputs_archive_inactive_stage_without_breaking_ownership_or_sealed_history()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        var key = new AnalysisRecoveryStageKey(ProjectScopeKey.From(scope), "authority", Guid.NewGuid(), "findings");
        Mock<IScopeContextProvider> scoped = new();
        scoped.Setup(provider => provider.GetCurrentScope()).Returns(scope);
        ISqlConnectionFactory connections = new SqlConnectionFactory(fixture.ConnectionString);
        SqlAnalysisRecoveryRepository checkpoints = new(connections, scoped.Object);
        Guid priorOwner = Guid.NewGuid();
        Guid replacementOwner = Guid.NewGuid();
        string priorVersion = new('A', 64);
        string nextVersion = new('B', 64);
        CancellationToken ct = CancellationToken.None;
        await using SqlConnection db = await connections.CreateOpenConnectionAsync(ct);
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(db,
            "fnd076-" + key.RunId.ToString("N"), key.RunId.ToString("N"), ct);

        AnalysisRecoveryClaim first = await checkpoints.ClaimForAuthorityInputsAsync(key, priorVersion, priorOwner, 30, 3, ct);
        AnalysisRecoveryClaim contended = await checkpoints.ClaimForAuthorityInputsAsync(key, nextVersion, replacementOwner, 30, 3, ct);
        Assert.Equal(priorOwner, contended.Owner);
        Assert.Equal(priorVersion, contended.InputVersion);

        Assert.True(await checkpoints.CompleteAsync(key, priorOwner, first.Fence, "original-output", null, ct));
        AnalysisRecoveryClaim replaced = await checkpoints.ClaimForAuthorityInputsAsync(key, nextVersion, replacementOwner, 30, 3, ct);
        Assert.Equal(replacementOwner, replaced.Owner);
        Assert.Equal(2, replaced.Attempts);
        Assert.True(replaced.Fence > first.Fence);
        Assert.False(await checkpoints.CompleteAsync(key, priorOwner, first.Fence, "obsolete-write", null, ct));

        string archived = await db.QuerySingleAsync<string>(new CommandDefinition("""
            SELECT ResultReference FROM dbo.AnalysisStageRecoveryHistory
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
              AND Pipeline = @Pipeline AND RunId = @RunId AND Stage = @Stage AND Fence = @Fence;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, key.Pipeline, key.RunId, key.Stage, first.Fence },
            cancellationToken: ct));
        Assert.Equal("original-output", archived);

        await using (SqlConnection validation = await connections.CreateOpenConnectionAsync(ct))
        await using (DapperArchLucidUnitOfWork uow = new(validation, validation.BeginTransaction()))
        {
            Assert.False(await checkpoints.IsCurrentAsync(key, priorVersion, "original-output", uow, ct));
            Assert.True(await checkpoints.CompleteAsync(key, replacementOwner, replaced.Fence, "replacement-output", uow, ct));
            Assert.True(await checkpoints.IsCurrentAsync(key, nextVersion, "replacement-output", uow, ct));
            await uow.CommitAsync(ct);
        }

        await db.ExecuteAsync(new CommandDefinition("""
            UPDATE dbo.Runs SET CompletedUtc = SYSUTCDATETIME()
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND RunId = @RunId;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, key.RunId }, cancellationToken: ct));
        AnalysisRecoveryClaim sealedRun = await checkpoints.ClaimForAuthorityInputsAsync(key, priorVersion, priorOwner, 30, 3, ct);
        Assert.Equal(nextVersion, sealedRun.InputVersion);
        Assert.Equal("replacement-output", sealedRun.ResultReference);
    }
}
