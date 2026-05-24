using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>
///     SQL-only persistence port for manifest finalization (run lock + <c>dbo.sp_FinalizeManifest</c>).
///     Application orchestration stays in <c>ManifestFinalizationService</c>; raw SQL lives here.
/// </summary>
public interface IManifestFinalizationSqlRepository
{
    /// <summary>
    ///     Acquires <c>UPDLOCK, ROWLOCK</c> on the scoped run row, or returns <see langword="null" /> when missing.
    /// </summary>
    Task<ManifestFinalizationLockedRunRow?> LockRunForFinalizationAsync(
        ScopeContext scope,
        Guid runId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Executes <c>dbo.sp_FinalizeManifest</c> and maps known SQL error numbers to domain exceptions.
    /// </summary>
    Task ExecuteFinalizeProcedureAsync(
        ManifestFinalizationProcedureRequest request,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken);
}
