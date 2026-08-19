using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

[TenantScopeExempt(TenantScopeExemptReason.SystemPlaneOnly, "Tenant registry and lifecycle SQL against system-plane tables and cross-catalog provisioning commands.")]
/// <remarks>
///     Aggregate methods live in <c>DapperTenantRepository.{Directory|Lifecycle|Workspace|Trial|Seat|Erasure}.cs</c>
///     partials that mirror <see cref="ITenantRepository"/>'s composed interfaces. The type remains one DI registration;
///     narrowing <see cref="TenantScopeExemptAttribute"/> to system-plane aggregates only requires separate classes.
/// </remarks>
public sealed partial class DapperTenantRepository(
    ISystemSqlConnectionFactory catalogConnectionFactory,
    ISqlConnectionFactory tenantPlaneConnectionFactory,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ITenantDatabaseBindingRepository tenantDatabaseBindingRepository,
    ITenantDatabaseResolver tenantDatabaseResolver) : ITenantRepository
{
    private readonly ISystemSqlConnectionFactory _catalogConnectionFactory =
        catalogConnectionFactory ?? throw new ArgumentNullException(nameof(catalogConnectionFactory));

    private readonly ISqlConnectionFactory _tenantPlaneConnectionFactory =
        tenantPlaneConnectionFactory ?? throw new ArgumentNullException(nameof(tenantPlaneConnectionFactory));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly ITenantDatabaseBindingRepository _tenantDatabaseBindingRepository =
        tenantDatabaseBindingRepository ?? throw new ArgumentNullException(nameof(tenantDatabaseBindingRepository));

    private readonly ITenantDatabaseResolver _tenantDatabaseResolver =
        tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));

    private static int ComputeDaysRemaining(DateTimeOffset? trialExpiresUtc)
    {
        if (trialExpiresUtc is null)
            return 0;

        double totalDays = (trialExpiresUtc.Value - TimeProvider.System.GetUtcNow()).TotalDays;
        int days = (int)Math.Floor(totalDays);

        return days < 0 ? 0 : days;
    }
    private async Task<SqlConnection> OpenDirectoryMetadataConnectionAsync(CancellationToken cancellationToken)
    {
        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
            return await _catalogConnectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task<TenantRecord?> QueryTenantByIdAsync(
        SqlConnection connection,
        Guid tenantId,
        CancellationToken ct)
    {
        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(TenantDirectorySql.SelectById, new
            {
                Id = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row?.ToRecord();
    }

    private static async Task<TenantRecord?> QueryTenantBySlugAsync(
        SqlConnection connection,
        string normalizedSlug,
        CancellationToken ct)
    {
        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(TenantDirectorySql.SelectBySlug, new
            {
                Slug = normalizedSlug
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<TenantRecord?> QueryTenantDirectoryByNormalizedOrganizationNameAsync(
        string normalizedOrganizationName,
        CancellationToken ct)
    {
        await using SqlConnection directoryConnection =
            await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        TenantRecord? fromDirectory =
            await QueryTenantByNormalizedOrganizationNameAsync(directoryConnection, normalizedOrganizationName, ct)
                .ConfigureAwait(false);

        if (fromDirectory is not null)
            return fromDirectory;

        if (TargetsSameCatalogAsSystem(directoryConnection.ConnectionString))
            return null;

        await using SqlConnection catalogConnection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await QueryTenantByNormalizedOrganizationNameAsync(catalogConnection, normalizedOrganizationName, ct)
            .ConfigureAwait(false);
    }

    private async Task<TenantRecord?> QueryTenantDirectoryBySlugAsync(string normalizedSlug, CancellationToken ct)
    {
        await using SqlConnection directoryConnection =
            await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        TenantRecord? fromDirectory =
            await QueryTenantBySlugAsync(directoryConnection, normalizedSlug, ct).ConfigureAwait(false);

        if (fromDirectory is not null)
            return fromDirectory;

        if (TargetsSameCatalogAsSystem(directoryConnection.ConnectionString))
            return null;

        await using SqlConnection catalogConnection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await QueryTenantBySlugAsync(catalogConnection, normalizedSlug, ct).ConfigureAwait(false);
    }

    private bool TargetsSameCatalogAsSystem(string connectionString) =>
        SqlCatalogRoutingGuard.TargetsSameCatalog(connectionString, _catalogConnectionFactory.SystemConnectionString);

    private static async Task<TenantRecord?> QueryTenantByNormalizedOrganizationNameAsync(
        SqlConnection connection,
        string normalizedOrganizationName,
        CancellationToken ct)
    {
        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(TenantDirectorySql.SelectByNormalizedOrganizationName, new
            {
                NormalizedOrganizationName = normalizedOrganizationName
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row?.ToRecord();
    }

    private static async Task ApplyTrialRunIncrementAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid tenantId,
        string selectSql,
        string updateSql,
        CancellationToken ct)
    {
        TrialRunGateRow? row = await connection.QuerySingleOrDefaultAsync<TrialRunGateRow>(
            new CommandDefinition(selectSql, new
            {
                Id = tenantId
            }, transaction, cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return;

        if (!string.Equals(row.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
            row.TrialRunsLimit is null ||
            row.TrialRunsLimit.Value < 1)
            return;

        if (row.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())

            throw new TrialLimitExceededException(
                TrialLimitReason.Expired,
                ComputeDaysRemaining(row.TrialExpiresUtc));

        if (row.TrialRunsUsed >= row.TrialRunsLimit.Value)

            throw new TrialLimitExceededException(
                TrialLimitReason.RunsExceeded,
                ComputeDaysRemaining(row.TrialExpiresUtc));

        int updated = await connection.ExecuteAsync(
            new CommandDefinition(
                updateSql,
                new
                {
                    Id = tenantId,
                    TrialLifecycleStatus.Active
                },
                transaction,
                cancellationToken: ct)).ConfigureAwait(false);

        if (updated == 0)

            throw new TrialLimitExceededException(
                TrialLimitReason.RunsExceeded,
                ComputeDaysRemaining(row.TrialExpiresUtc));
    }

    private sealed class TrialFirstManifestOutputRow
    {
        public int TrialRunsUsed
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialStartUtc
        {
            get;
            init;
        }
    }

    private sealed class TrialRunGateRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }
    }

    private sealed class TenantSeatRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public int? TrialSeatsLimit
        {
            get;
            init;
        }

        public int TrialSeatsUsed
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }
    }

    private sealed class WorkspaceRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid DefaultProjectId
        {
            get;
            init;
        }
    }

    private sealed class WorkspaceListRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public Guid DefaultProjectId
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }
    }

    private sealed class TenantRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string Slug
        {
            get;
            init;
        } = string.Empty;

        public string Tier
        {
            get;
            init;
        } = string.Empty;

        public Guid? EntraTenantId
        {
            get;
            init;
        }

        public string DataRegion
        {
            get;
            init;
        } = TenantDataRegions.Default;

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? SuspendedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TenantErasureRequestedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? OffboardedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? ErasureEligibleUtc
        {
            get;
            init;
        }

        public DateTimeOffset? LegalHoldUntilUtc
        {
            get;
            init;
        }

        public string? LegalHoldReason
        {
            get;
            init;
        }

        public string? LegalHoldSetByUserId
        {
            get;
            init;
        }

        public DateTimeOffset? LegalHoldSetUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialStartUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }

        public int? TrialSeatsLimit
        {
            get;
            init;
        }

        public int TrialSeatsUsed
        {
            get;
            init;
        }

        public string? TrialStatus
        {
            get;
            init;
        }

        public Guid? TrialSampleRunId
        {
            get;
            init;
        }

        public DateTimeOffset? TrialArchitecturePreseedEnqueuedUtc
        {
            get;
            init;
        }

        public int TrialArchitecturePreseedAttemptCount
        {
            get;
            init;
        }

        public DateTimeOffset? TrialArchitecturePreseedFailedUtc
        {
            get;
            init;
        }

        public string? TrialArchitecturePreseedLastError
        {
            get;
            init;
        }

        public Guid? TrialWelcomeRunId
        {
            get;
            init;
        }

        public DateTimeOffset? TrialFirstManifestCommittedUtc
        {
            get;
            init;
        }

        public decimal? BaselineReviewCycleHours
        {
            get;
            init;
        }

        public string? BaselineReviewCycleSource
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineReviewCycleCapturedUtc
        {
            get;
            init;
        }

        public decimal? BaselineManualPrepHoursPerReview
        {
            get;
            init;
        }

        public int? BaselinePeoplePerReview
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineManualPrepCapturedUtc
        {
            get;
            init;
        }

        public string? CompanySize
        {
            get;
            init;
        }

        public int? ArchitectureTeamSize
        {
            get;
            init;
        }

        public string? IndustryVertical
        {
            get;
            init;
        }

        public string? IndustryVerticalOther
        {
            get;
            init;
        }

        public int? EnterpriseSeatsLimit
        {
            get;
            init;
        }

        public int EnterpriseSeatsUsed
        {
            get;
            init;
        }

        internal TenantRecord ToRecord()
        {
            return new TenantRecord
            {
                Id = Id,
                Name = Name,
                Slug = Slug,
                Tier = TenantTierSql.ParseTier(Tier),
                EntraTenantId = EntraTenantId,
                DataRegion = TenantDataRegions.NormalizeOptional(DataRegion),
                CreatedUtc = CreatedUtc,
                SuspendedUtc = SuspendedUtc,
                TenantErasureRequestedUtc = TenantErasureRequestedUtc,
                OffboardedUtc = OffboardedUtc,
                ErasureEligibleUtc = ErasureEligibleUtc,
                LegalHoldUntilUtc = LegalHoldUntilUtc,
                LegalHoldReason = LegalHoldReason,
                LegalHoldSetByUserId = LegalHoldSetByUserId,
                LegalHoldSetUtc = LegalHoldSetUtc,
                TrialStartUtc = TrialStartUtc,
                TrialExpiresUtc = TrialExpiresUtc,
                TrialRunsLimit = TrialRunsLimit,
                TrialRunsUsed = TrialRunsUsed,
                TrialSeatsLimit = TrialSeatsLimit,
                TrialSeatsUsed = TrialSeatsUsed,
                TrialStatus = TrialStatus,
                TrialSampleRunId = TrialSampleRunId,
                TrialArchitecturePreseedEnqueuedUtc = TrialArchitecturePreseedEnqueuedUtc,
                TrialArchitecturePreseedAttemptCount = TrialArchitecturePreseedAttemptCount,
                TrialArchitecturePreseedFailedUtc = TrialArchitecturePreseedFailedUtc,
                TrialArchitecturePreseedLastError = TrialArchitecturePreseedLastError,
                TrialWelcomeRunId = TrialWelcomeRunId,
                TrialFirstManifestCommittedUtc = TrialFirstManifestCommittedUtc,
                BaselineReviewCycleHours = BaselineReviewCycleHours,
                BaselineReviewCycleSource = BaselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = BaselineReviewCycleCapturedUtc,
                BaselineManualPrepHoursPerReview = BaselineManualPrepHoursPerReview,
                BaselinePeoplePerReview = BaselinePeoplePerReview,
                BaselineManualPrepCapturedUtc = BaselineManualPrepCapturedUtc,
                CompanySize = CompanySize,
                ArchitectureTeamSize = ArchitectureTeamSize,
                IndustryVertical = IndustryVertical,
                IndustryVerticalOther = IndustryVerticalOther,
                EnterpriseSeatsLimit = EnterpriseSeatsLimit,
                EnterpriseSeatsUsed = EnterpriseSeatsUsed
            };
        }
    }
}
