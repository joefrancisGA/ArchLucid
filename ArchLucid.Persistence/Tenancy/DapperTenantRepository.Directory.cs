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

        await using SqlConnection tenantPlaneConnection =
            await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        TenantRecord? fromTenantPlane =
            await QueryTenantByNormalizedOrganizationNameAsync(tenantPlaneConnection, normalizedName, ct)
                .ConfigureAwait(false);

        if (fromTenantPlane is not null)
            return fromTenantPlane;

        if (TargetsSameCatalogAsSystem(tenantPlaneConnection.ConnectionString))
            return null;

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

        TenantRow? row = await connection.QuerySingleOrDefaultAsync<TenantRow>(
            new CommandDefinition(TenantDirectorySql.SelectByEntraTenantId, new
            {
                EntraTenantId = entraTenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row?.ToRecord();
    }


    public async Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct)
    {
        await using SqlConnection connection = await OpenDirectoryMetadataConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<TenantRow> rows =
            await connection.QueryAsync<TenantRow>(
                new CommandDefinition(TenantDirectorySql.ListOrderByCreatedUtcDesc, cancellationToken: ct))
                .ConfigureAwait(false);

        return rows.Select(static r => r.ToRecord()).ToList();
    }
}
