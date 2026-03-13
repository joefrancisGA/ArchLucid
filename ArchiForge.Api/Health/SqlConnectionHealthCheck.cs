using System.Data.Common;
using ArchiForge.Data.Infrastructure;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchiForge.Api.Health;

public sealed class SqlConnectionHealthCheck : IHealthCheck
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SqlConnectionHealthCheck(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var connection = (DbConnection)_connectionFactory.CreateConnection();
            await using var _ = connection;
            await connection.OpenAsync(cancellationToken);
            return HealthCheckResult.Healthy("Database connection successful.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed.", ex);
        }
    }
}
