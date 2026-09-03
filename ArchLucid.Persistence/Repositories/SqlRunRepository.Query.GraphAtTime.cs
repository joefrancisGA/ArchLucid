using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{

    public async Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityProjectSlug);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectLatestWithGraphAtOrBefore,
                    RunListQueryParameters.ForLatestGraphAtOrBefore(scope, authorityProjectSlug, asOfUtc),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetLatestRunWithGraphAtOrBefore,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                RunRepositorySql.ClearGraphSnapshotForArchitecture,
                RunListQueryParameters.ForClearGraphSnapshotForArchitecture(scope, architectureId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetLatestRunIdForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectLatestRunIdForArchitecture,
                RunListQueryParameters.ForLatestRunIdForArchitecture(scope, architectureId),
                cancellationToken: ct)).ConfigureAwait(false);
    }
}
