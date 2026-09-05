using ArchLucid.Api.Attributes;
using ArchLucid.Api.Formatters;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Net.Http.Headers;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    /// <summary>
    ///     Exports audit events in the current scope as JSON, CSV, or CEF. Date bounds and optional facet filters match
    ///     <see cref="SearchAudit" /> (<c>ToUtc</c> is inclusive for export; see <see cref="IAuditRepository.GetFilteredExportAsync" />).
    /// </summary>
    /// <param name="fromUtc">Range start (UTC), inclusive (<c>&gt;=</c>).</param>
    /// <param name="toUtc">Range end (UTC), inclusive (<c>&lt;=</c>) — same semantics as audit search.</param>
    /// <param name="eventType">Optional event-type filter (same as search).</param>
    /// <param name="correlationId">Optional correlation id filter (same as search).</param>
    /// <param name="actorUserId">Optional actor user id filter (same as search).</param>
    /// <param name="runId">Optional run id filter (same as search).</param>
    /// <param name="maxRows">Maximum rows to return; repository clamps to 1–10,000 (default 10,000).</param>
    /// <param name="format">
    ///     Optional export shape: <c>csv</c>, <c>json</c>, or <c>cef</c> (ArcSight CEF lines). When omitted, the response
    ///     follows standard content negotiation via <c>Accept</c> (JSON vs CSV).
    /// </param>
    [HttpGet("export")]
    [Authorize(Policy = ArchLucidPolicies.RequireAuditor)]
    [RequiresCommercialTenantTier(TenantTier.Enterprise)]
    [Produces("application/json", "text/csv", "text/plain")]
    [ProducesResponseType(typeof(IReadOnlyList<AuditEvent>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> ExportAudit(
        [FromQuery] DateTime fromUtc,
        [FromQuery] DateTime toUtc,
        [FromQuery] string? eventType = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] string? actorUserId = null,
        [FromQuery] Guid? runId = null,
        [FromQuery] int maxRows = 10_000,
        [FromQuery] string? format = null,
        CancellationToken ct = default)
    {
        DateTime from = exportFormatter.NormalizeExportInstantUtc(fromUtc);
        DateTime to = exportFormatter.NormalizeExportInstantUtc(toUtc);

        if (from > to)
            return this.BadRequestProblem(
                "fromUtc must not be after toUtc.",
                ProblemTypes.ValidationFailed);

        if (to - from > TimeSpan.FromDays(90))
            return this.BadRequestProblem(
                "The requested date range must not exceed 90 days.",
                ProblemTypes.ValidationFailed);

        int exportMaxRows = Math.Clamp(maxRows <= 0 ? 10_000 : maxRows, 1, 10_000);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        AuditEventFilter exportFilter = new()
        {
            FromUtc = from,
            ToUtc = to,
            EventType = string.IsNullOrWhiteSpace(eventType) ? null : eventType.Trim(),
            CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? null : correlationId.Trim(),
            ActorUserId = string.IsNullOrWhiteSpace(actorUserId) ? null : actorUserId.Trim(),
            RunId = runId,
            Take = exportMaxRows
        };

        IActionResult? rowCapProblem =
            await EnsureAuditExportWithinRowCapOrConflictAsync(scope, exportFilter, exportMaxRows, ct);

        if (rowCapProblem is not null)
            return rowCapProblem;

        if (!string.IsNullOrWhiteSpace(format))
        {
            string f = format.Trim().ToLowerInvariant();

            if (f is not ("csv" or "json" or "cef"))
                return this.BadRequestProblem(
                    "format must be csv, json, or cef when supplied.",
                    ProblemTypes.ValidationFailed);

            if (f == "cef")
            {
                IReadOnlyList<AuditEvent> events = await repo.GetFilteredExportAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    exportFilter,
                    ct);

                await using MemoryStream buffer = new();
                await AuditCefLineWriter.WriteAllAsync(buffer, events, ct).ConfigureAwait(false);
                byte[] utf8 = buffer.ToArray();
                string cefName = exportFormatter.BuildAuditExportCefFileName(from, to);

                return File(utf8, "text/plain", cefName);
            }

            if (f == "csv")
            {
                string csvName = exportFormatter.BuildAuditExportCsvFileName(from, to);
                IAsyncEnumerable<AuditEvent> csvStream = repo.StreamFilteredExportAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    exportFilter,
                    ct);

                await AuditEventCsvResponseWriter.WriteAsync(Response, exportFormatter, csvStream, csvName, ct);
                return new EmptyResult();
            }
        }

        if (PrefersCsvResponse(format))
        {
            string attachmentName = exportFormatter.BuildAuditExportCsvFileName(from, to);
            IAsyncEnumerable<AuditEvent> csvStream = repo.StreamFilteredExportAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                exportFilter,
                ct);

            await AuditEventCsvResponseWriter.WriteAsync(Response, exportFormatter, csvStream, attachmentName, ct);
            return new EmptyResult();
        }

        IReadOnlyList<AuditEvent> jsonEvents = await repo.GetFilteredExportAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            exportFilter,
            ct);

        return Ok(jsonEvents);
    }

    private bool PrefersCsvResponse(string? format)
    {
        if (!string.IsNullOrWhiteSpace(format))
            return string.Equals(format.Trim(), "csv", StringComparison.OrdinalIgnoreCase);

        IList<MediaTypeHeaderValue>? accept = Request.GetTypedHeaders().Accept;

        if (accept is null || accept.Count == 0)
            return false;

        foreach (MediaTypeHeaderValue mediaType in accept.OrderByDescending(static header => header.Quality ?? 1.0))
        {
            string? media = mediaType.MediaType.Value;

            if (string.Equals(media, "text/csv", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(media, "application/json", StringComparison.OrdinalIgnoreCase))
                return false;
        }

        return false;
    }
}
