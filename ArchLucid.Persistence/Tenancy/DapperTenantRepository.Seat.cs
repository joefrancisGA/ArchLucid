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
}
