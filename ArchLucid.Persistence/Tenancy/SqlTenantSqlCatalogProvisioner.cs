using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Runs tenant DbUp scripts and mirrors the control-plane <c>dbo.Tenants</c> row into the tenant catalog.</summary>
public sealed class SqlTenantSqlCatalogProvisioner(
    ISystemSqlConnectionFactory systemSqlConnectionFactory,
    ITenantDatabaseBindingRepository bindingRepository,
    ITenantDatabaseResolver tenantDatabaseResolver,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ILogger<SqlTenantSqlCatalogProvisioner> logger) : ITenantSqlCatalogProvisioner
{
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    private readonly ITenantDatabaseBindingRepository _bindingRepository =
        bindingRepository ?? throw new ArgumentNullException(nameof(bindingRepository));

    private readonly ITenantDatabaseResolver _tenantDatabaseResolver =
        tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly ILogger<SqlTenantSqlCatalogProvisioner> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task ProvisionTenantCatalogAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs)
            return;

        try
        {
            await _bindingRepository.UpsertPendingAsync(tenantId, sqlLogicalDatabaseName, cancellationToken);

            if (string.IsNullOrWhiteSpace(snapshot.TenantCatalogConnectionStringTemplate))

                throw new InvalidOperationException(
                    "ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate is required when provisioning tenant catalogs.");

            string tenantConnectionString = SqlTenantCatalogConnectionStringFactory.FromTemplate(
                snapshot.TenantCatalogConnectionStringTemplate.Trim(),
                sqlLogicalDatabaseName.Trim());

            DatabaseMigrator.RunTenant(tenantConnectionString);
            await MirrorTenantRowFromSystemAsync(tenantId, tenantConnectionString, cancellationToken);
            await _bindingRepository.MarkActiveAsync(tenantId, cancellationToken);
            _tenantDatabaseResolver.InvalidateCachedTenantConnectionString(tenantId);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Tenant catalog provisioning failed for tenant {TenantId}.", tenantId);

            await _bindingRepository.MarkFailedAsync(tenantId, ex.Message, cancellationToken);

            throw;
        }
    }

    private async Task MirrorTenantRowFromSystemAsync(
        Guid tenantId,
        string tenantConnectionString,
        CancellationToken cancellationToken)
    {
        await using SqlConnection systemConnection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string selectSql = """
                                 SELECT Id, Name, Slug, Tier, EntraTenantId, CreatedUtc, SuspendedUtc,
                                        TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                        TrialStatus, TrialSampleRunId,
                                        TrialArchitecturePreseedEnqueuedUtc, TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                        BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                        BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                        CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                        EnterpriseSeatsLimit, EnterpriseSeatsUsed
                                 FROM dbo.Tenants
                                 WHERE Id = @Id;
                                 """;

        CatalogTenantRow? row = await systemConnection.QuerySingleOrDefaultAsync<CatalogTenantRow>(
            new CommandDefinition(selectSql, new { Id = tenantId }, cancellationToken: cancellationToken));

        if (row is null)
            throw new InvalidOperationException(
                "Control-plane tenant row is missing before tenant catalog mirror for id '" + tenantId.ToString("D") + "'.");

        await using SqlConnection tenantConnection = new(
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(tenantConnectionString));

        await tenantConnection.OpenAsync(cancellationToken);

        const string insertSql = """
                                 IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Id)
                                 BEGIN
                                     INSERT INTO dbo.Tenants (
                                         Id, Name, Slug, Tier, EntraTenantId, CreatedUtc, SuspendedUtc,
                                         TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                         TrialStatus, TrialSampleRunId,
                                         TrialArchitecturePreseedEnqueuedUtc, TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                         BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                         BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                         CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                         EnterpriseSeatsLimit, EnterpriseSeatsUsed)
                                     VALUES (
                                         @Id, @Name, @Slug, @Tier, @EntraTenantId, @CreatedUtc, @SuspendedUtc,
                                         @TrialStartUtc, @TrialExpiresUtc, @TrialRunsLimit, @TrialRunsUsed, @TrialSeatsLimit, @TrialSeatsUsed,
                                         @TrialStatus, @TrialSampleRunId,
                                         @TrialArchitecturePreseedEnqueuedUtc, @TrialWelcomeRunId, @TrialFirstManifestCommittedUtc,
                                         @BaselineReviewCycleHours, @BaselineReviewCycleSource, @BaselineReviewCycleCapturedUtc,
                                         @BaselineManualPrepHoursPerReview, @BaselinePeoplePerReview, @BaselineManualPrepCapturedUtc,
                                         @CompanySize, @ArchitectureTeamSize, @IndustryVertical, @IndustryVerticalOther,
                                         @EnterpriseSeatsLimit, @EnterpriseSeatsUsed);
                                 END
                                 """;

        await tenantConnection.ExecuteAsync(new CommandDefinition(insertSql, row, cancellationToken: cancellationToken));
    }

#pragma warning disable CA1812 // instantiated via Dapper
    private sealed class CatalogTenantRow
#pragma warning restore CA1812
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
    }
}
