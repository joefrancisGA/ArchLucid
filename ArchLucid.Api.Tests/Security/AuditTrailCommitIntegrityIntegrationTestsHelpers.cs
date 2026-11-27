using ArchLucid.TestSupport;

namespace ArchLucid.Api.Tests.Security;

/// <summary>Shared SQL reachability probe for TB-290/TB-291 integration tests.</summary>
internal static class AuditTrailCommitIntegrityIntegrationTestsHelpers
{
    internal static bool IsSqlReachable()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)))
        {
            return false;
        }

        // Once SQL is configured, a broken connection is a failed prerequisite, not a skip.
        string connectionString = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString("master");
        Microsoft.Data.SqlClient.SqlConnectionStringBuilder builder = new(connectionString)
        {
            ConnectTimeout = 4,
            ConnectRetryCount = 0
        };
        using Microsoft.Data.SqlClient.SqlConnection connection = new(builder.ConnectionString);
        connection.Open();
        return true;
    }
}
