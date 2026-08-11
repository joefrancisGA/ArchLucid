using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{

    /// <inheritdoc />
    public async Task CommitSelfServiceTrialAsync(
        Guid tenantId,
        DateTimeOffset trialStartUtc,
        DateTimeOffset trialExpiresUtc,
        int runsLimit,
        int seatsLimit,
        Guid sampleRunId,
        decimal? baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset? baselineReviewCycleCapturedUtc,
        string? companySize,
        int? architectureTeamSize,
        string? industryVertical,
        string? industryVerticalOther,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialStartUtc = @TrialStartUtc,
                               TrialExpiresUtc = @TrialExpiresUtc,
                               TrialRunsLimit = @TrialRunsLimit,
                               TrialRunsUsed = 0,
                               TrialSeatsLimit = @TrialSeatsLimit,
                               TrialSeatsUsed = 0,
                               TrialStatus = @TrialStatus,
                               TrialSampleRunId = @TrialSampleRunId,
                               BaselineReviewCycleHours = @BaselineReviewCycleHours,
                               BaselineReviewCycleSource = @BaselineReviewCycleSource,
                               BaselineReviewCycleCapturedUtc = @BaselineReviewCycleCapturedUtc,
                               CompanySize = @CompanySize,
                               ArchitectureTeamSize = @ArchitectureTeamSize,
                               IndustryVertical = @IndustryVertical,
                               IndustryVerticalOther = @IndustryVerticalOther
                           WHERE Id = @Id;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    TrialStartUtc = trialStartUtc,
                    TrialExpiresUtc = trialExpiresUtc,
                    TrialRunsLimit = runsLimit,
                    TrialSeatsLimit = seatsLimit,
                    TrialStatus = TrialLifecycleStatus.Active,
                    TrialSampleRunId = sampleRunId,
                    BaselineReviewCycleHours = baselineReviewCycleHours,
                    BaselineReviewCycleSource = baselineReviewCycleSource,
                    BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
                    CompanySize = companySize,
                    ArchitectureTeamSize = architectureTeamSize,
                    IndustryVertical = industryVertical,
                    IndustryVerticalOther = industryVerticalOther
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task PersistTrialSignupBaselineReviewCycleAsync(
        Guid tenantId,
        decimal baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset baselineReviewCycleCapturedUtc,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET BaselineReviewCycleHours = @BaselineReviewCycleHours,
                               BaselineReviewCycleSource = @BaselineReviewCycleSource,
                               BaselineReviewCycleCapturedUtc = @BaselineReviewCycleCapturedUtc
                           WHERE Id = @Id;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    BaselineReviewCycleHours = baselineReviewCycleHours,
                    BaselineReviewCycleSource = baselineReviewCycleSource,
                    BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task MarkTrialConvertedAsync(Guid tenantId, TenantTier? newCommercialTier, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialStatus = @Converted,
                               Tier = CASE WHEN @NewTier IS NULL THEN Tier ELSE @NewTier END
                           WHERE Id = @Id AND TrialStatus = @Active;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    TrialLifecycleStatus.Active,
                    TrialLifecycleStatus.Converted,
                    NewTier = newCommercialTier?.ToString()
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        const string selectSql = """
                                 SELECT TrialStatus, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed
                                 FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                                 WHERE Id = @Id;
                                 """;

        const string updateSql = """
                                 UPDATE dbo.Tenants
                                 SET TrialRunsUsed = TrialRunsUsed + 1
                                 WHERE Id = @Id
                                   AND TrialStatus = @Active
                                   AND TrialRunsLimit IS NOT NULL
                                   AND TrialRunsLimit > 0
                                   AND TrialExpiresUtc > SYSUTCDATETIME()
                                   AND TrialRunsUsed < TrialRunsLimit;
                                 """;

        if (connection is not null)
        {
            await ApplyTrialRunIncrementAsync(connection, transaction, tenantId, selectSql, updateSql, ct).ConfigureAwait(false);

            return;
        }

        await using SqlConnection owned = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await owned.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            await ApplyTrialRunIncrementAsync(owned, tran, tenantId, selectSql, updateSql, ct).ConfigureAwait(false);
            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }


    /// <inheritdoc />
    public async Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalKey);

        string key = principalKey.Trim();

        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        const string tenantSql = """
                                 SELECT TrialStatus, TrialSeatsLimit, TrialSeatsUsed, TrialExpiresUtc
                                 FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                                 WHERE Id = @Id;
                                 """;

        TenantSeatRow? t = await connection.QuerySingleOrDefaultAsync<TenantSeatRow>(
            new CommandDefinition(tenantSql, new
            {
                Id = tenantId
            }, tran, cancellationToken: ct)).ConfigureAwait(false);

        if (t is null ||
            !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
            t.TrialSeatsLimit is null ||
            t.TrialSeatsLimit.Value < 1)
        {
            await tran.CommitAsync(ct).ConfigureAwait(false);

            return;
        }

        if (t.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);

            throw new TrialLimitExceededException(
                TrialLimitReason.Expired,
                ComputeDaysRemaining(t.TrialExpiresUtc));
        }

        const string insertSql = """
                                 INSERT INTO dbo.TenantTrialSeatOccupants (TenantId, PrincipalKey, CreatedUtc)
                                 VALUES (@TenantId, @PrincipalKey, SYSUTCDATETIME());
                                 """;

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertSql, new
                {
                    TenantId = tenantId,
                    PrincipalKey = key
                }, tran,
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == 2627)
        {
            await tran.CommitAsync(ct).ConfigureAwait(false);

            return;
        }

        const string bumpSql = """
                               UPDATE dbo.Tenants
                               SET TrialSeatsUsed = TrialSeatsUsed + 1
                               WHERE Id = @Id
                                 AND TrialStatus = @Active
                                 AND TrialSeatsUsed < @SeatLimit;
                               """;

        int bumped = await connection.ExecuteAsync(
            new CommandDefinition(
                bumpSql,
                new
                {
                    Id = tenantId,
                    TrialLifecycleStatus.Active,
                    SeatLimit = t.TrialSeatsLimit.Value
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        if (bumped == 0)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    DELETE FROM dbo.TenantTrialSeatOccupants
                    WHERE TenantId = @TenantId AND PrincipalKey = @PrincipalKey;
                    """,
                    new
                    {
                        TenantId = tenantId,
                        PrincipalKey = key
                    },
                    tran,
                    cancellationToken: ct)).ConfigureAwait(false);

            await tran.RollbackAsync(ct).ConfigureAwait(false);

            throw new TrialLimitExceededException(
                TrialLimitReason.SeatsExceeded,
                ComputeDaysRemaining(t.TrialExpiresUtc));
        }

        await tran.CommitAsync(ct).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT Id
                           FROM dbo.Tenants
                           WHERE TrialExpiresUtc IS NOT NULL
                             AND TrialStatus IS NOT NULL
                             AND TrialStatus <> @Converted
                           ORDER BY CreatedUtc ASC;
                           """;

        if (_topologyOptions.CurrentValue.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TrialLifecycleStatus.Converted
                    },
                    cancellationToken: ct)).ConfigureAwait(false);

            return ids.ToList();
        }

        IReadOnlyList<TenantDatabaseBindingRecord> actives =
            await _tenantDatabaseBindingRepository.ListBindingsWithStateAsync(TenantDatabaseProvisioningState.Active, ct);

        HashSet<Guid> merged = [];

        foreach (TenantDatabaseBindingRecord binding in actives)
        {
            string cs =
                await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(binding.TenantId, ct);

            await using SqlConnection connection = new(SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(cs));

            await connection.OpenAsync(ct);

            IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TrialLifecycleStatus.Converted
                    },
                    cancellationToken: ct)).ConfigureAwait(false);

            foreach (Guid id in ids)
                merged.Add(id);
        }

        return merged.ToList();
    }


    /// <inheritdoc />
    public async Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialArchitecturePreseedEnqueuedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id
                             AND TrialWelcomeRunId IS NULL
                             AND (TrialArchitecturePreseedEnqueuedUtc IS NULL);
                           """;

        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (@Take) Id
                           FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                           WHERE TrialArchitecturePreseedEnqueuedUtc IS NOT NULL
                             AND TrialWelcomeRunId IS NULL
                             AND TrialArchitecturePreseedFailedUtc IS NULL
                             AND TrialArchitecturePreseedAttemptCount < 5
                             AND TrialStatus = @Active
                           ORDER BY TrialArchitecturePreseedEnqueuedUtc ASC;
                           """;

        IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new
                {
                    Take = Math.Clamp(take, 1, 50),
                    TrialLifecycleStatus.Active
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return ids.ToList();
    }


    /// <inheritdoc />
    public async Task MarkTrialArchitecturePreseedCompletedAsync(Guid tenantId, Guid welcomeRunId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialWelcomeRunId = @WelcomeRunId
                           WHERE Id = @Id
                             AND TrialWelcomeRunId IS NULL;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                Id = tenantId,
                WelcomeRunId = welcomeRunId
            }, cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<int> IncrementTrialArchitecturePreseedAttemptAsync(Guid tenantId, string lastError, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialArchitecturePreseedAttemptCount = TrialArchitecturePreseedAttemptCount + 1,
                               TrialArchitecturePreseedLastError = @LastError,
                               TrialArchitecturePreseedFailedUtc = CASE
                                   WHEN TrialArchitecturePreseedAttemptCount + 1 >= 5 THEN SYSUTCDATETIME()
                                   ELSE TrialArchitecturePreseedFailedUtc
                               END
                           OUTPUT INSERTED.TrialArchitecturePreseedAttemptCount
                           WHERE Id = @Id;
                           """;

        string trimmedError = string.IsNullOrWhiteSpace(lastError)
            ? "unknown"
            : lastError.Trim();

        if (trimmedError.Length > 2048)
            trimmedError = trimmedError[..2048];

        int attemptCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    LastError = trimmedError
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return attemptCount;
    }


    /// <inheritdoc />
    public async Task<bool> TryRecordTrialLifecycleTransitionAsync(
        Guid tenantId,
        string expectedCurrentStatus,
        string nextStatus,
        string reason,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedCurrentStatus);
        ArgumentException.ThrowIfNullOrWhiteSpace(nextStatus);

        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        const string insertLog = """
                                 INSERT INTO dbo.TenantLifecycleTransitions (TenantId, FromStatus, ToStatus, OccurredUtc, Reason)
                                 VALUES (@TenantId, @FromStatus, @ToStatus, SYSUTCDATETIME(), @Reason);
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertLog,
                new
                {
                    TenantId = tenantId,
                    FromStatus = expectedCurrentStatus,
                    ToStatus = nextStatus,
                    Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim()
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        const string updateTenant = """
                                    UPDATE dbo.Tenants
                                    SET TrialStatus = @NextStatus
                                    WHERE Id = @TenantId AND TrialStatus = @ExpectedStatus;
                                    """;

        int updated = await connection.ExecuteAsync(
            new CommandDefinition(
                updateTenant,
                new
                {
                    TenantId = tenantId,
                    ExpectedStatus = expectedCurrentStatus,
                    NextStatus = nextStatus
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        if (updated == 0)
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);

            return false;
        }

        await tran.CommitAsync(ct).ConfigureAwait(false);

        return true;
    }


    /// <inheritdoc />
    public async Task<TrialFirstManifestCommitOutcome?> TryMarkFirstManifestCommittedAsync(
        Guid tenantId,
        DateTimeOffset committedUtc,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialFirstManifestCommittedUtc = @CommittedUtc
                           OUTPUT INSERTED.TrialRunsUsed,
                                  INSERTED.TrialRunsLimit,
                                  INSERTED.CreatedUtc,
                                  INSERTED.TrialStartUtc
                           WHERE Id = @TenantId
                             AND TrialFirstManifestCommittedUtc IS NULL;
                           """;

        TrialFirstManifestOutputRow? row = await connection.QuerySingleOrDefaultAsync<TrialFirstManifestOutputRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    CommittedUtc = committedUtc
                },
                cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return null;

        DateTimeOffset anchor = row.TrialStartUtc ?? row.CreatedUtc;
        double seconds = (committedUtc - anchor).TotalSeconds;

        double ratio = 0;

        if (row.TrialRunsLimit is { } lim and > 0)

            ratio = (double)row.TrialRunsUsed / lim;

        return new TrialFirstManifestCommitOutcome { SignupToCommitSeconds = seconds, TrialRunUsageRatio = ratio };
    }


    /// <inheritdoc />
    public async Task E2eHarnessSetTrialExpiresUtcAsync(Guid tenantId, DateTimeOffset expiresUtc, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialExpiresUtc = @ExpiresUtc
                           WHERE Id = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                TenantId = tenantId,
                ExpiresUtc = expiresUtc
            }, cancellationToken: ct)).ConfigureAwait(false);
    }
}
