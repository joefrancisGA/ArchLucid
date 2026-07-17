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
public sealed class DapperTenantRepository(
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

    public async Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await QueryTenantByIdAsync(connection, tenantId, ct).ConfigureAwait(false);
    }

    public async Task<TenantRecord?> GetByIdFromControlPlaneCatalogAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await QueryTenantByIdAsync(connection, tenantId, ct).ConfigureAwait(false);
    }

    public async Task<TenantRecord?> GetBySlugFromControlPlaneCatalogAsync(string slug, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        string normalizedSlug = slug.Trim().ToLowerInvariant();

        // Self-service /v1/register duplicate gates must read dbo.Tenants on the control-plane catalog even when the
        // ambient HTTP scope is DefaultTenant and tenant-plane routing would open a different catalog.
        await using SqlConnection connection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await QueryTenantBySlugAsync(connection, normalizedSlug, ct).ConfigureAwait(false);
    }

    public async Task<TenantRecord?> GetByNormalizedOrganizationNameAsync(string normalizedOrganizationName, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedOrganizationName);

        string normalizedName = normalizedOrganizationName.Trim().ToUpperInvariant();

        await using SqlConnection catalogConnection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        TenantRecord? fromCatalog =
            await QueryTenantByNormalizedOrganizationNameAsync(catalogConnection, normalizedName, ct)
                .ConfigureAwait(false);

        if (fromCatalog is not null)
            return fromCatalog;

        return await QueryTenantDirectoryByNormalizedOrganizationNameAsync(normalizedName, ct).ConfigureAwait(false);
    }

    public async Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        string normalizedSlug = slug.Trim().ToLowerInvariant();

        TenantRecord? fromDirectory = await QueryTenantDirectoryBySlugAsync(normalizedSlug, ct).ConfigureAwait(false);

        if (fromDirectory is not null)
            return fromDirectory;

        await using SqlConnection tenantConnection =
            await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        if (TargetsSameCatalogAsSystem(tenantConnection.ConnectionString))
            return null;

        return await QueryTenantBySlugAsync(tenantConnection, normalizedSlug, ct).ConfigureAwait(false);
    }

    public async Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                  TenantErasureRequestedUtc,
                                  OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                  TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                  TrialStatus, TrialSampleRunId,
                                  TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                  TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                  TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                  BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                  BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                  CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                  EnterpriseSeatsLimit, EnterpriseSeatsUsed
                           FROM dbo.Tenants
                           WHERE EntraTenantId = @EntraTenantId;
                           """;

        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new
            {
                EntraTenantId = entraTenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row?.ToRecord();
    }

    public async Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct)
    {
        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                  TenantErasureRequestedUtc,
                                  OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                  TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                  TrialStatus, TrialSampleRunId,
                                  TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                  TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                  TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                  BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                  BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                  CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                  EnterpriseSeatsLimit, EnterpriseSeatsUsed
                           FROM dbo.Tenants
                           ORDER BY CreatedUtc DESC;
                           """;

        IEnumerable<TenantRow> rows =
            await connection.QueryAsync<TenantRow>(new CommandDefinition(sql, cancellationToken: ct)).ConfigureAwait(false);

        return rows.Select(static r => r.ToRecord()).ToList();
    }

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
    public async Task UpdateBaselineAsync(
        Guid tenantId,
        decimal? manualPrepHoursPerReview,
        int? peoplePerReview,
        DateTimeOffset? capturedUtc,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET BaselineManualPrepHoursPerReview = @ManualPrepHours,
                               BaselinePeoplePerReview = @PeoplePerReview,
                               BaselineManualPrepCapturedUtc = @CapturedUtc
                           WHERE Id = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    ManualPrepHours = manualPrepHoursPerReview,
                    PeoplePerReview = peoplePerReview,
                    CapturedUtc = capturedUtc
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
    public async Task<bool> UpdateEntraTenantIdAsync(Guid tenantId, Guid entraTenantId, CancellationToken ct)
    {
        TenantRecord? tenant = await GetByIdAsync(tenantId, ct).ConfigureAwait(false);

        if (tenant is null)
            return false;

        if (tenant.EntraTenantId is { } existing && existing != entraTenantId)
            return false;

        if (tenant.EntraTenantId == entraTenantId)
            return true;

        TenantRecord? holder = await GetByEntraTenantIdAsync(entraTenantId, ct).ConfigureAwait(false);

        if (holder is not null && holder.Id != tenantId)
            return false;

        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET EntraTenantId = @EntraTenantId
                           WHERE Id = @Id
                             AND (EntraTenantId IS NULL OR EntraTenantId = @EntraTenantId);
                           """;

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                Id = tenantId,
                EntraTenantId = entraTenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return rows == 1;
    }

    public async Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null)
    {
        // Control-plane registry writes always target the system catalog; never the scoped tenant-plane factory.
        await using SqlConnection connection =
            await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        string normalizedSlug = slug.Trim().ToLowerInvariant();

        string sql = enterpriseScimSeatsLimit is null
            ? """
              INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId, DataRegion)
              VALUES (@Id, @Name, @Slug, @Tier, @EntraTenantId, @DataRegion);
              """
            : """
              INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId, EnterpriseSeatsLimit, DataRegion)
              VALUES (@Id, @Name, @Slug, @Tier, @EntraTenantId, @EnterpriseSeatsLimit, @DataRegion);
              """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    Name = name,
                    Slug = normalizedSlug,
                    Tier = TenantTierSql.ToTierString(tier),
                    EntraTenantId = entraTenantId,
                    EnterpriseSeatsLimit = enterpriseScimSeatsLimit,
                    DataRegion = dataRegion
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                           VALUES (@Id, @TenantId, @Name, @DefaultProjectId);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = workspaceId,
                    TenantId = tenantId,
                    Name = name,
                    DefaultProjectId = defaultProjectId
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET SuspendedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id;
                           """;

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            await catalog.ExecuteAsync(new CommandDefinition(sql, new
            {
                Id = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenant = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        await tenant.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (1) Id AS WorkspaceId, DefaultProjectId
                           FROM dbo.TenantWorkspaces
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc ASC;
                           """;

        WorkspaceRow? row = await connection.QuerySingleOrDefaultAsync<WorkspaceRow>(
            new CommandDefinition(sql, new
            {
                TenantId = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row is null ? null : new TenantWorkspaceLink { WorkspaceId = row.WorkspaceId, DefaultProjectId = row.DefaultProjectId };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT Id AS WorkspaceId, TenantId, Name, DefaultProjectId, CreatedUtc
                           FROM dbo.TenantWorkspaces
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc ASC;
                           """;

        IEnumerable<WorkspaceListRow> rows =
            await connection.QueryAsync<WorkspaceListRow>(
                new CommandDefinition(sql, new
                {
                    TenantId = tenantId
                }, cancellationToken: ct)).ConfigureAwait(false);

        return rows.Select(static r => new TenantWorkspaceListItem
            {
                WorkspaceId = r.WorkspaceId,
                TenantId = r.TenantId,
                Name = r.Name,
                DefaultProjectId = r.DefaultProjectId,
                CreatedUtc = r.CreatedUtc
            })
            .ToList();
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

    /// <inheritdoc />
    public async Task<bool> TryIncrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET EnterpriseSeatsUsed = EnterpriseSeatsUsed + 1
                           WHERE Id = @TenantId
                             AND (EnterpriseSeatsLimit IS NULL OR EnterpriseSeatsUsed < EnterpriseSeatsLimit);
                           """;

        int rows = await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            TenantId = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);

        return rows == 1;
    }

    /// <inheritdoc />
    public async Task DecrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET EnterpriseSeatsUsed = CASE WHEN EnterpriseSeatsUsed > 0 THEN EnterpriseSeatsUsed - 1 ELSE 0 END
                           WHERE Id = @TenantId;
                           """;

        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            TenantId = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<bool> TryApproveTenantErasureAsync(Guid tenantId, DateTimeOffset approvedUtc, string approvedByUserId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TenantErasureApprovedUtc = @ApprovedUtc,
                               TenantErasureApprovedByUserId = @ApprovedByUserId
                           WHERE Id = @TenantId
                             AND OffboardedUtc IS NOT NULL
                             AND TenantErasureApprovedUtc IS NULL;
                           """;

        int rows = await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            TenantId = tenantId,
            ApprovedUtc = approvedUtc,
            ApprovedByUserId = approvedByUserId
        }, cancellationToken: ct)).ConfigureAwait(false);

        return rows == 1;
    }

    /// <inheritdoc />
    public async Task<bool> TryStartTenantErasureOffboardAsync(
        Guid tenantId,
        DateTimeOffset offboardedUtc,
        DateTimeOffset erasureEligibleUtc,
        CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET OffboardedUtc = @OffboardedUtc,
                               ErasureEligibleUtc = @ErasureEligibleUtc,
                               TenantErasureRequestedUtc = @OffboardedUtc
                           WHERE Id = @Id AND OffboardedUtc IS NULL;
                           """;

        object args = new
        {
            Id = tenantId,
            OffboardedUtc = offboardedUtc,
            ErasureEligibleUtc = erasureEligibleUtc
        };

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            await catalog.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenantConn = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int tenantRows = await tenantConn.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);

        return tenantRows == 1;
    }

    /// <inheritdoc />
    public async Task<bool> TryRestoreTenantErasureQuarantineAsync(Guid tenantId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET OffboardedUtc = NULL,
                               ErasureEligibleUtc = NULL,
                               SuspendedUtc = NULL,
                               TenantErasureRequestedUtc = NULL,
                               TenantErasureApprovedUtc = NULL,
                               TenantErasureApprovedByUserId = NULL
                           WHERE Id = @Id AND OffboardedUtc IS NOT NULL;
                           """;

        object args = new { Id = tenantId };

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            await catalog.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenantConn = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int tenantRows = await tenantConn.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);

        return tenantRows == 1;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetTenantErasureLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset legalHoldUntilUtc,
        DateTimeOffset utcNow,
        string? reason,
        string legalHoldSetByUserId,
        CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET LegalHoldUntilUtc = @LegalHoldUntilUtc,
                               LegalHoldReason = @LegalHoldReason,
                               LegalHoldSetByUserId = @LegalHoldSetByUserId,
                               LegalHoldSetUtc = SYSUTCDATETIME()
                           WHERE Id = @Id AND @LegalHoldUntilUtc > @UtcNow;
                           """;

        object args = new
        {
            Id = tenantId,
            LegalHoldUntilUtc = legalHoldUntilUtc,
            UtcNow = utcNow,
            LegalHoldReason = reason,
            LegalHoldSetByUserId = legalHoldSetByUserId
        };

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            await catalog.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenantConn = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int tenantRows = await tenantConn.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);

        return tenantRows == 1;
    }

    /// <inheritdoc />
    public async Task<bool> TryClearTenantErasureLegalHoldAsync(Guid tenantId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.Tenants
                           SET LegalHoldUntilUtc = NULL,
                               LegalHoldReason = NULL,
                               LegalHoldSetByUserId = NULL,
                               LegalHoldSetUtc = NULL
                           WHERE Id = @Id AND LegalHoldUntilUtc IS NOT NULL;
                           """;

        object args = new { Id = tenantId };

        if (_topologyOptions.CurrentValue.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection catalog = await _catalogConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            await catalog.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
        }

        await using SqlConnection tenantConn = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int tenantRows = await tenantConn.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);

        return tenantRows == 1;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTenantIdsEligibleForScheduledHardPurgeAsync(
        DateTimeOffset utcNow,
        int take,
        CancellationToken ct)
    {
        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (@Take) Id
                           FROM dbo.Tenants
                           WHERE OffboardedUtc IS NOT NULL
                             AND ErasureEligibleUtc IS NOT NULL AND ErasureEligibleUtc <= @UtcNow
                             AND (LegalHoldUntilUtc IS NULL OR LegalHoldUntilUtc <= @UtcNow)
                           ORDER BY ErasureEligibleUtc ASC;
                           """;

        IEnumerable<Guid> ids =
            await connection.QueryAsync<Guid>(new CommandDefinition(sql, new
            {
                Take = take,
                UtcNow = utcNow
            }, cancellationToken: ct)).ConfigureAwait(false);

        return ids.ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTenantIdsForOrphanedCatalogCleanupAsync(
        DateTimeOffset utcNow,
        DateTimeOffset erasureRequestedOnOrBefore,
        int take,
        CancellationToken ct)
    {
        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (@Take) Id
                           FROM dbo.Tenants
                           WHERE TenantErasureRequestedUtc IS NOT NULL
                             AND TenantErasureRequestedUtc <= @ErasureRequestedOnOrBefore
                             AND TenantErasureApprovedUtc IS NOT NULL
                             AND (LegalHoldUntilUtc IS NULL OR LegalHoldUntilUtc <= @UtcNow)
                           ORDER BY TenantErasureRequestedUtc ASC;
                           """;

        IEnumerable<Guid> ids =
            await connection.QueryAsync<Guid>(new CommandDefinition(sql, new
            {
                Take = take,
                ErasureRequestedOnOrBefore = erasureRequestedOnOrBefore,
                UtcNow = utcNow
            }, cancellationToken: ct)).ConfigureAwait(false);

        return ids.ToList();
    }

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
        const string sql = """
                           SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                  TenantErasureRequestedUtc,
                                  OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                  TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                  TrialStatus, TrialSampleRunId,
                                  TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                  TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                  TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                  BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                  BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                  CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                  EnterpriseSeatsLimit, EnterpriseSeatsUsed
                           FROM dbo.Tenants
                           WHERE Id = @Id;
                           """;

        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new
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
        const string sql = """
                           SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                  TenantErasureRequestedUtc,
                                  OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                  TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                  TrialStatus, TrialSampleRunId,
                                  TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                  TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                  TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                  BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                  BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                  CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                  EnterpriseSeatsLimit, EnterpriseSeatsUsed
                           FROM dbo.Tenants
                           WHERE Slug = @Slug;
                           """;

        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new
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
        const string sql = """
                           SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                  TenantErasureRequestedUtc,
                                  OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                  TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                  TrialStatus, TrialSampleRunId,
                                  TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                  TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                  TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                  BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                  BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                  CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                  EnterpriseSeatsLimit, EnterpriseSeatsUsed
                           FROM dbo.Tenants
                           WHERE UPPER(LTRIM(RTRIM(Name))) = @NormalizedOrganizationName;
                           """;

        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new
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
