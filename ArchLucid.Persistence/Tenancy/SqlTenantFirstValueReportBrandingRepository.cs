using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via higher-level API tests.")]
public sealed class SqlTenantFirstValueReportBrandingRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantFirstValueReportBrandingRepository
{
    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantFirstValueReportBrandingRow?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => TryGetCoreAsync(tenantId, ct), cancellationToken);

    private async Task<TenantFirstValueReportBrandingRow?> TryGetCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                           SELECT BrandingLogoUrl,
                                  BrandingCompanyName
                           FROM dbo.Tenants
                           WHERE Id = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (row is null)
            return null;

        return new TenantFirstValueReportBrandingRow(row.BrandingLogoUrl, row.BrandingCompanyName);
    }

    private sealed class Row
    {
        public string? BrandingLogoUrl
        {
            get;
            init;
        }

        public string? BrandingCompanyName
        {
            get;
            init;
        }
    }
}
