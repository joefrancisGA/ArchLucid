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
}
