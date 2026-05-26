using System;
using Polly;

namespace ArchLucid.Persistence.Audit;

public sealed class AuditSqlRetryPolicyProvider : IAuditSqlRetryPolicyProvider
{
    public IAsyncPolicy GetRetryPolicy()
    {
        return Policy
            .Handle<Microsoft.Data.SqlClient.SqlException>(ex =>
                ex.Number == 40613 || ex.Number == 40197 || ex.Number == 40501 || ex.Number == 40645 ||
                ex.Number == 10928 || ex.Number == 10929 || ex.Number == 10060 || ex.Number == 10053 ||
                ex.Number == 10054 || ex.Number == 233)
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }
}
