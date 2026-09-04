using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

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
        TenantTrialLifecycleCore.CommitSelfServiceTrialMutation mutation =
            TenantTrialLifecycleCore.CreateCommitSelfServiceTrialMutation(
                trialStartUtc,
                trialExpiresUtc,
                runsLimit,
                seatsLimit,
                sampleRunId,
                baselineReviewCycleHours,
                baselineReviewCycleSource,
                baselineReviewCycleCapturedUtc,
                companySize,
                architectureTeamSize,
                industryVertical,
                industryVerticalOther);

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
                TenantTrialLifecycleCore.CreateCommitSelfServiceTrialSqlParameters(tenantId, mutation),
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
}
