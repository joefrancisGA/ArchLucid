using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{
    /// <inheritdoc />
    public async Task<TrialFirstManifestCommitOutcome?> TryMarkFirstManifestCommittedAsync(
        Guid tenantId,
        DateTimeOffset committedUtc,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialFirstManifestCommittedUtc = @CommittedUtc
                           OUTPUT INSERTED.TrialRunsUsed,
                                  INSERTED.TrialRunsLimit,
                                  INSERTED.CreatedUtc,
                                  INSERTED.TrialStartUtc
                           WHERE Id = @TenantId
                             AND TrialFirstManifestCommittedUtc IS NULL;
                           """;

        TrialFirstManifestOutputRow? row = await connection.QuerySingleOrDefaultAsync<TrialFirstManifestOutputRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    CommittedUtc = committedUtc
                },
                cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return null;

        return TenantTrialLifecycleCore.ComputeFirstManifestCommitOutcome(
            new TenantTrialLifecycleCore.TrialFirstManifestSourceRow
            {
                TrialRunsUsed = row.TrialRunsUsed,
                TrialRunsLimit = row.TrialRunsLimit,
                CreatedUtc = row.CreatedUtc,
                TrialStartUtc = row.TrialStartUtc,
            },
            committedUtc);
    }
}
