using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Exports finalized architecture reviews as DOCX, PDF, or HTML.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RunsExportController(
    IArchitectureReviewExportService exportService,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IArchitectureReviewExportService _exportService =
        exportService ?? throw new ArgumentNullException(nameof(exportService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>Downloads a review export for the given run (<c>docx</c>, <c>pdf</c>, or <c>html</c>).</summary>
    [HttpGet("{runId}/export/{format}")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Export(
        [FromRoute] string runId,
        [FromRoute] string format,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);

        if (!TryParseFormat(format, out ExportFormat exportFormat))
        {
            return this.BadRequestProblem(
                "format must be one of: docx, pdf, html.",
                ProblemTypes.ValidationFailed);
        }

        try
        {
            ExportResult result = await _exportService.GenerateReportAsync(
                runId.Trim(),
                exportFormat,
                whitelabel: null,
                logoImageBytes: null,
                httpCorrelationId: HttpContext.TraceIdentifier,
                cancellationToken);

            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            Guid? auditRunId = Guid.TryParseExact(runId.Trim(), "N", out Guid runGuidN)
                ? runGuidN
                : Guid.TryParse(runId.Trim(), out Guid runGuid) ? runGuid : null;

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ExportDownloadSucceeded,
                    RunId = auditRunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new { exportType = exportFormat.ToString(), fileName = result.FileName },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            return File(result.Content, result.ContentType, result.FileName);
        }
        catch (RunNotFoundException)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }
        catch (ConflictException conflict)
        {
            return this.ConflictProblem(conflict.Message, ProblemTypes.Conflict);
        }
    }

    private static bool TryParseFormat(string format, out ExportFormat exportFormat)
    {
        exportFormat = default;

        if (string.IsNullOrWhiteSpace(format))
            return false;

        if (string.Equals(format, "docx", StringComparison.OrdinalIgnoreCase))
        {
            exportFormat = ExportFormat.Docx;

            return true;
        }

        if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            exportFormat = ExportFormat.Pdf;

            return true;
        }

        if (string.Equals(format, "html", StringComparison.OrdinalIgnoreCase))
        {
            exportFormat = ExportFormat.Html;

            return true;
        }

        return false;
    }
}
