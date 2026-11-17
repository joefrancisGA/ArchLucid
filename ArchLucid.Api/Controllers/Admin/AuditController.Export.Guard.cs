using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    private async Task<(IReadOnlyList<AuditEvent> Events, IActionResult? Problem)> ReadAuditExportAsync(
        ScopeContext scope,
        AuditEventFilter filter,
        CancellationToken cancellationToken)
    {
        filter.IncludeExportOverflowRow = true;
        IReadOnlyList<AuditEvent> events = await repo.GetFilteredExportAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            cancellationToken);

        if (events.Count <= filter.Take)
            return (events, null);

        return ([], this.ConflictProblem(
            $"Audit export blocked: at least {events.Count} events match the filter but maxRows is {filter.Take}. "
            + "Narrow the date range or filters, or raise maxRows up to 10,000.",
            ProblemTypes.AuditExportRowCapExceeded));
    }
}
