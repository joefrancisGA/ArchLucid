using System;
using Polly;

namespace ArchLucid.Persistence.Audit;

public sealed class AuditSqlRetryPolicyProvider : IAuditSqlRetryPolicyProvider
{
    public IAsyncPolicy GetRetryPolicy()
    {
        return Policy
            .Handle<Microsoft.Data.SqlClient.SqlException>(ex =>
                // Azure SQL / SQL Elastic Pool transient faults
                ex.Number == 40613 || ex.Number == 40197 || ex.Number == 40501 || ex.Number == 40645 ||
                // Resource throttling / connection rate limits
                ex.Number == 10928 || ex.Number == 10929 ||
                // Network-layer connection failures
                ex.Number == 10060 || ex.Number == 10053 || ex.Number == 10054 || ex.Number == 233 ||
                // Server-side session abort (severity 20, number 0): SQL Server killed the connection
                // under resource pressure.  The INSERT is idempotent via EventId PK; retry is safe.
                ex.Number == 0)
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }
}
