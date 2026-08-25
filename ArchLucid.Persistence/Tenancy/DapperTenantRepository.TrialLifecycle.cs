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
