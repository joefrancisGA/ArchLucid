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

    public async Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedId,
                    RunRecordParameters.ForRun(scope, runId),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedIdIncludingArchived,
                    RunRecordParameters.ForRun(scope, runId),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Admin run lookup by id within the active tenant catalog.")]
    public async Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(RunRepositorySql.SelectByRunIdAdmin, new
                {
                    RunId = runId
                }, cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByIdAdmin,
                sw.Elapsed.TotalMilliseconds);
        }
    }
}
