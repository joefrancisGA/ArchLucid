using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Tenant-routed checkpoint storage. Every state transition is scoped and fenced in SQL.</summary>
public sealed class SqlAnalysisRecoveryRepository(
    ISqlConnectionFactory connectionFactory, IScopeContextProvider scopeProvider) : IAnalysisRecoveryRepository
{
    private const string KeyPredicate = """
        TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
            AND Pipeline = @Pipeline AND RunId = @RunId AND Stage = @Stage
        """;

    private const string ScopedRead = $"{Read} WHERE {KeyPredicate}";

    private const string Owned = """
        AND State = N'running' AND Owner = @Owner AND Fence = @Fence AND LeaseUntilUtc > SYSUTCDATETIME()
        """;

    private const string Read = """
        SELECT State, InputVersion, ResultReference, Owner, Fence, Attempts, LeaseUntilUtc
        FROM dbo.AnalysisStageRecovery
        """;

    public async Task<AnalysisRecoveryClaim?> ReadAsync(AnalysisRecoveryStageKey key, CancellationToken cancellationToken)
    {
        DynamicParameters parameters = Bind(key);
        await using SqlConnection db = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await db.QuerySingleOrDefaultAsync<AnalysisRecoveryClaim>(
            new CommandDefinition(ScopedRead, parameters, cancellationToken: cancellationToken));
    }

    public async Task<AnalysisRecoveryClaim> ClaimAsync(
        AnalysisRecoveryStageKey key, string inputVersion, Guid owner, int leaseSeconds, int maxAttempts,
        CancellationToken cancellationToken)
    {
        DynamicParameters parameters = Bind(key);
        parameters.Add("InputVersion", inputVersion);
        parameters.Add("Owner", owner);
        parameters.Add("LeaseSeconds", leaseSeconds);
        parameters.Add("MaxAttempts", maxAttempts);
        await using SqlConnection db = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction tx = (SqlTransaction)await db.BeginTransactionAsync(cancellationToken);
        const string sql = $"""
            IF NOT EXISTS (SELECT 1 FROM dbo.AnalysisStageRecovery WITH (UPDLOCK, HOLDLOCK) WHERE {KeyPredicate})
            BEGIN
                INSERT dbo.AnalysisStageRecovery
                    (TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage, InputVersion, State,
                     Owner, Fence, Attempts, LeaseUntilUtc, UpdatedUtc)
                VALUES (@TenantId, @WorkspaceId, @ProjectId, @Pipeline, @RunId, @Stage, @InputVersion, N'running',
                        @Owner, 1, 1, DATEADD(second, @LeaseSeconds, SYSUTCDATETIME()), SYSUTCDATETIME());
            END
            ELSE
            BEGIN
                UPDATE dbo.AnalysisStageRecovery
                   SET State = CASE WHEN Attempts < @MaxAttempts THEN N'running' ELSE N'failed' END,
                       Owner = CASE WHEN Attempts < @MaxAttempts THEN @Owner END,
                       Fence = Fence + 1,
                       Attempts = CASE WHEN Attempts < @MaxAttempts THEN Attempts + 1 ELSE Attempts END,
                       LeaseUntilUtc = CASE WHEN Attempts < @MaxAttempts
                           THEN DATEADD(second, @LeaseSeconds, SYSUTCDATETIME()) END,
                       UpdatedUtc = SYSUTCDATETIME()
                 WHERE {KeyPredicate} AND InputVersion = @InputVersion
                   AND (State = N'retry' OR (State = N'running' AND LeaseUntilUtc <= SYSUTCDATETIME()));
            END
            {Read} WHERE {KeyPredicate};
            """;
        AnalysisRecoveryClaim answer = await db.QuerySingleAsync<AnalysisRecoveryClaim>(
            new CommandDefinition(sql, parameters, tx, cancellationToken: cancellationToken));
        await tx.CommitAsync(cancellationToken);

        return answer;
    }

    public async Task<AnalysisRecoveryClaim> ClaimForAuthorityInputsAsync(
        AnalysisRecoveryStageKey key, string inputVersion, Guid owner, int leaseSeconds, int maxAttempts,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(key.Pipeline, "authority", StringComparison.Ordinal))
            throw new ArgumentException("Only unsealed Authority stages can replace a checkpoint.", nameof(key));

        DynamicParameters parameters = Bind(key);
        parameters.Add("InputVersion", inputVersion);
        parameters.Add("Owner", owner);
        parameters.Add("LeaseSeconds", leaseSeconds);
        parameters.Add("MaxAttempts", maxAttempts);
        await using SqlConnection db = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction tx = (SqlTransaction)await db.BeginTransactionAsync(cancellationToken);
        const string sql = $"""
            DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();
            IF EXISTS (SELECT 1 FROM dbo.Runs WITH (UPDLOCK, HOLDLOCK)
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId
                  AND RunId = @RunId AND GoldenManifestId IS NULL AND CompletedUtc IS NULL AND ArchivedUtc IS NULL)
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM dbo.AnalysisStageRecovery WITH (UPDLOCK, HOLDLOCK) WHERE {KeyPredicate})
                BEGIN
                    INSERT dbo.AnalysisStageRecovery
                        (TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage, InputVersion, State,
                         Owner, Fence, Attempts, LeaseUntilUtc, UpdatedUtc)
                    VALUES (@TenantId, @WorkspaceId, @ProjectId, @Pipeline, @RunId, @Stage, @InputVersion, N'running',
                            @Owner, 1, 1, DATEADD(second, @LeaseSeconds, SYSUTCDATETIME()), SYSUTCDATETIME());
                END
                ELSE
                BEGIN
                    INSERT dbo.AnalysisStageRecoveryHistory
                        (TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage, InputVersion, State,
                         Fence, Attempts, ResultReference, SupersededUtc)
                    SELECT TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage, InputVersion, State,
                           Fence, Attempts, ResultReference, SYSUTCDATETIME()
                    FROM dbo.AnalysisStageRecovery WITH (UPDLOCK, HOLDLOCK)
                    WHERE {KeyPredicate} AND InputVersion <> @InputVersion AND Attempts < @MaxAttempts
                      AND (Owner IS NULL OR LeaseUntilUtc <= @Now);

                    UPDATE dbo.AnalysisStageRecovery
                       SET InputVersion = @InputVersion,
                           State = CASE WHEN Attempts < @MaxAttempts THEN N'running' ELSE N'failed' END,
                           Owner = CASE WHEN Attempts < @MaxAttempts THEN @Owner END,
                           Fence = Fence + 1,
                           Attempts = CASE WHEN Attempts < @MaxAttempts THEN Attempts + 1 ELSE Attempts END,
                           ResultReference = NULL,
                           LeaseUntilUtc = CASE WHEN Attempts < @MaxAttempts
                               THEN DATEADD(second, @LeaseSeconds, SYSUTCDATETIME()) END,
                           UpdatedUtc = SYSUTCDATETIME()
                     WHERE {KeyPredicate}
                       AND (Owner IS NULL OR LeaseUntilUtc <= @Now)
                       AND ((InputVersion <> @InputVersion AND Attempts < @MaxAttempts)
                           OR (InputVersion = @InputVersion AND State IN (N'running', N'retry')));
                END
            END
            {Read} WHERE {KeyPredicate};
            """;
        AnalysisRecoveryClaim? answer = await db.QuerySingleOrDefaultAsync<AnalysisRecoveryClaim>(
            new CommandDefinition(sql, parameters, tx, cancellationToken: cancellationToken));
        await tx.CommitAsync(cancellationToken);

        return answer ?? throw new InvalidOperationException("An unsealed scoped Authority run is required.");
    }

    public async Task<bool> IsCurrentAsync(AnalysisRecoveryStageKey key, string inputVersion, string resultReference,
        IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken)
    {
        DynamicParameters parameters = Bind(key);
        parameters.Add("InputVersion", inputVersion);
        parameters.Add("ResultReference", resultReference);

        if (!unitOfWork.SupportsExternalTransaction)
            throw new InvalidOperationException("Dependency verification requires the publication transaction.");

        const string sql = $"""
            SELECT COUNT_BIG(1) FROM dbo.AnalysisStageRecovery WITH (UPDLOCK, HOLDLOCK)
            WHERE {KeyPredicate} AND State = N'succeeded' AND InputVersion = @InputVersion
                AND ResultReference = @ResultReference;
            """;
        return await unitOfWork.Connection.ExecuteScalarAsync<long>(new CommandDefinition(
            sql, parameters, unitOfWork.Transaction, cancellationToken: cancellationToken)) == 1;
    }

    public Task<bool> RenewAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, int leaseSeconds, CancellationToken cancellationToken) =>
        WriteOwnedAsync(key, owner, fence,
            "renew", leaseSeconds, null, null, null, cancellationToken);

    public Task<bool> CompleteAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string resultReference,
        IArchLucidUnitOfWork? unitOfWork, CancellationToken cancellationToken) =>
        WriteOwnedAsync(key, owner, fence,
            "complete", 0, resultReference, null, unitOfWork, cancellationToken);

    public Task<bool> ReleaseAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, bool retryable, CancellationToken cancellationToken) =>
        WriteOwnedAsync(key, owner, fence, "release", 0, null,
            retryable ? "retry" : "failed", null, cancellationToken);

    public Task<bool> ReleaseWithCoverageReasonAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string reason, CancellationToken cancellationToken) =>
        WriteOwnedAsync(key, owner, fence, "release", 0, AnalysisCoverageReasons.Encode(reason),
            "failed", null, cancellationToken);

    private async Task<bool> WriteOwnedAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string operation, int leaseSeconds,
        string? resultReference, string? failureState, IArchLucidUnitOfWork? unitOfWork, CancellationToken cancellationToken)
    {
        DynamicParameters parameters = Bind(key);
        parameters.Add("Owner", owner);
        parameters.Add("Fence", fence);
        parameters.Add("Operation", operation);
        parameters.Add("LeaseSeconds", leaseSeconds);
        parameters.Add("ResultReference", resultReference);
        parameters.Add("FailureState", failureState);
        const string sql = $"""
            UPDATE dbo.AnalysisStageRecovery
               SET State = CASE @Operation WHEN N'renew' THEN State WHEN N'complete' THEN N'succeeded' ELSE @FailureState END,
                   Owner = CASE WHEN @Operation = N'renew' THEN Owner END,
                   LeaseUntilUtc = CASE WHEN @Operation = N'renew'
                       THEN DATEADD(second, @LeaseSeconds, SYSUTCDATETIME()) END,
                   ResultReference = CASE WHEN @Operation IN (N'complete', N'release') THEN @ResultReference END,
                   UpdatedUtc = SYSUTCDATETIME()
            WHERE {KeyPredicate} {Owned};
            """;

        if (unitOfWork is not null)
        {
            if (!unitOfWork.SupportsExternalTransaction || unitOfWork.Connection is null || unitOfWork.Transaction is null)
                throw new InvalidOperationException("A recoverable stage requires an enlisted SQL transaction.");

            return await ExecuteAsync(unitOfWork.Connection, unitOfWork.Transaction);
        }

        await using SqlConnection db = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await ExecuteAsync(db, null);

        async Task<bool> ExecuteAsync(IDbConnection connection, IDbTransaction? transaction) =>
            await connection.ExecuteAsync(new CommandDefinition(
                sql, parameters, transaction, cancellationToken: cancellationToken)) == 1;
    }

    private DynamicParameters Bind(AnalysisRecoveryStageKey key)
    {
        ArgumentNullException.ThrowIfNull(key);
        ScopeContext authorized = scopeProvider.GetCurrentScope();

        if (!key.Scope.Matches(authorized.TenantId, authorized.WorkspaceId, authorized.ProjectId))
            throw new InvalidOperationException("Analysis recovery requires the active project scope.");

        if (key.RunId == Guid.Empty || key.Pipeline.Length is 0 or > 32 || key.Stage.Length is 0 or > 64)
            throw new ArgumentException("Invalid analysis recovery stage identity.", nameof(key));

        return new DynamicParameters(new
        {
            key.Scope.TenantId, key.Scope.WorkspaceId, key.Scope.ProjectId, key.Pipeline, key.RunId, key.Stage
        });
    }
}
