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
///     Aggregate methods live in <c>DapperTenantRepository.{Directory|Lifecycle|Workspace|TrialPreseed|TrialSeats|TrialLifecycle|Seat|Erasure}.cs</c>
///     partials that mirror <see cref="ITenantRepository"/>'s composed interfaces. Dapper row types live in
///     <c>DapperTenantRepository.Rows.cs</c>. The type remains one DI registration;
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
}
