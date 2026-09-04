using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    /// <summary>Wave-21 suggestion 204: fail-closed when export row cap would silently truncate the filtered set.</summary>
    private async Task<IActionResult?> EnsureAuditExportWithinRowCapOrConflictAsync(
        ScopeContext scope,
        AuditEventFilter filter,
        int exportMaxRows,
        CancellationToken cancellationToken)
    {
        int matchingRows = await repo.CountFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            cancellationToken);

        if (matchingRows <= exportMaxRows)
            return null;

        return this.ConflictProblem(
            $"Audit export blocked: {matchingRows} events match the filter but maxRows is {exportMaxRows}. "
            + "Narrow the date range or filters, or raise maxRows up to 10,000.",
            ProblemTypes.AuditExportRowCapExceeded);
    }
}
