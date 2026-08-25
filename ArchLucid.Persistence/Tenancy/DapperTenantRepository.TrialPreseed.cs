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
    public async Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialArchitecturePreseedEnqueuedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id
                             AND TrialWelcomeRunId IS NULL
                             AND (TrialArchitecturePreseedEnqueuedUtc IS NULL);
                           """;

        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = tenantId
        }, cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (@Take) Id
                           FROM dbo.Tenants WITH (UPDLOCK, ROWLOCK)
                           WHERE TrialArchitecturePreseedEnqueuedUtc IS NOT NULL
                             AND TrialWelcomeRunId IS NULL
                             AND TrialArchitecturePreseedFailedUtc IS NULL
                             AND TrialArchitecturePreseedAttemptCount < 5
                             AND TrialStatus = @Active
                           ORDER BY TrialArchitecturePreseedEnqueuedUtc ASC;
                           """;

        IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new
                {
                    Take = Math.Clamp(take, 1, 50),
                    TrialLifecycleStatus.Active
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return ids.ToList();
    }


    /// <inheritdoc />
    public async Task MarkTrialArchitecturePreseedCompletedAsync(Guid tenantId, Guid welcomeRunId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialWelcomeRunId = @WelcomeRunId
                           WHERE Id = @Id
                             AND TrialWelcomeRunId IS NULL;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                Id = tenantId,
                WelcomeRunId = welcomeRunId
            }, cancellationToken: ct)).ConfigureAwait(false);
    }


    /// <inheritdoc />
    public async Task<int> IncrementTrialArchitecturePreseedAttemptAsync(Guid tenantId, string lastError, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialArchitecturePreseedAttemptCount = TrialArchitecturePreseedAttemptCount + 1,
                               TrialArchitecturePreseedLastError = @LastError,
                               TrialArchitecturePreseedFailedUtc = CASE
                                   WHEN TrialArchitecturePreseedAttemptCount + 1 >= 5 THEN SYSUTCDATETIME()
                                   ELSE TrialArchitecturePreseedFailedUtc
                               END
                           OUTPUT INSERTED.TrialArchitecturePreseedAttemptCount
                           WHERE Id = @Id;
                           """;

        string trimmedError = string.IsNullOrWhiteSpace(lastError)
            ? "unknown"
            : lastError.Trim();

        if (trimmedError.Length > 2048)
            trimmedError = trimmedError[..2048];

        int attemptCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    Id = tenantId,
                    LastError = trimmedError
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return attemptCount;
    }
}
