using ArchLucid.Api.Formatters;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    /// <summary>
    ///     Exports audit events in the current scope as a CSV file. Filter parameters match
    ///     <see cref="SearchAudit" />; all are optional.
    /// </summary>
    /// <param name="eventType">Optional event-type filter (exact match, same as search).</param>
    /// <param name="fromUtc">Range start (UTC), inclusive (<c>&gt;=</c>).</param>
    /// <param name="toUtc">Range end (UTC), inclusive (<c>&lt;=</c>).</param>
    /// <param name="correlationId">Optional correlation id filter.</param>
    /// <param name="actorUserId">Optional actor user id filter.</param>
    /// <param name="runId">Optional run id filter.</param>
    /// <param name="maxRows">Row cap; clamped to 1–10,000 (default 10,000).</param>
    [HttpGet("export/csv")]
    [Authorize(Policy = ArchLucidPolicies.RequireAuditor)]
    [Produces("text/csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ExportAuditCsv(
        [FromQuery] string? eventType = null,
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] string? actorUserId = null,
        [FromQuery] Guid? runId = null,
        [FromQuery] int maxRows = 10_000,
        CancellationToken ct = default)
    {
        DateTime? effectiveFrom = fromUtc.HasValue
            ? exportFormatter.NormalizeExportInstantUtc(fromUtc.Value)
            : null;

        DateTime? effectiveTo = toUtc.HasValue
            ? exportFormatter.NormalizeExportInstantUtc(toUtc.Value)
            : null;

        if (effectiveFrom.HasValue && effectiveTo.HasValue && effectiveFrom.Value > effectiveTo.Value)
            return this.BadRequestProblem("fromUtc must not be after toUtc.", ProblemTypes.ValidationFailed);

        int exportMaxRows = Math.Clamp(maxRows <= 0 ? 10_000 : maxRows, 1, 10_000);
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (runId is not null && runId.Value != Guid.Empty)
        {
            try
            {
                await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                    runId.Value.ToString("N"),
                    scope,
                    authorityQueryService,
                    manifestHashService,
                    ct);
            }
            catch (ConflictException ex)
            {
                return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
            }
        }

        AuditEventFilter filter = new()
        {
            EventType = string.IsNullOrWhiteSpace(eventType) ? null : eventType.Trim(),
            FromUtc = effectiveFrom,
            ToUtc = effectiveTo,
            CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? null : correlationId.Trim(),
            ActorUserId = string.IsNullOrWhiteSpace(actorUserId) ? null : actorUserId.Trim(),
            RunId = runId,
            Take = exportMaxRows
        };

        IActionResult? rowCapProblem =
            await EnsureAuditExportWithinRowCapOrConflictAsync(scope, filter, exportMaxRows, ct);

        if (rowCapProblem is not null)
            return rowCapProblem;

        DateTime nameFrom = effectiveFrom ?? TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime nameTo = effectiveTo ?? nameFrom;
        string attachmentName = exportFormatter.BuildAuditExportCsvFileName(nameFrom, nameTo);

        IAsyncEnumerable<AuditEvent> events = repo.StreamFilteredExportAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            ct);

        await AuditEventCsvResponseWriter.WriteAsync(Response, exportFormatter, events, attachmentName, ct);

        return new EmptyResult();
    }
}
