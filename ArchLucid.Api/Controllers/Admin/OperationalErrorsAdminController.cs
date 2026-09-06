using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform operational error inbox for internal staff review.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/operational-errors")]
[EnableRateLimiting("fixed")]
public sealed class OperationalErrorsAdminController(OperationalErrorSearchService searchService) : ControllerBase
{
    private readonly OperationalErrorSearchService _searchService =
        searchService ?? throw new ArgumentNullException(nameof(searchService));

    /// <summary>Lists platform operational errors newest-first with optional filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OperationalErrorRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListOperationalErrors(
        [FromQuery] int maxRows = 100,
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] string? category = null,
        [FromQuery] string? source = null,
        [FromQuery] int? minStatusCode = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        OperationalErrorSearchCriteria criteria = new()
        {
            MaxRows = maxRows,
            FromUtc = fromUtc,
            ToUtc = toUtc,
            Category = category,
            Source = source,
            MinStatusCode = minStatusCode,
            TenantId = tenantId,
            CorrelationId = correlationId,
            Search = search
        };

        try
        {
            IReadOnlyList<OperationalErrorRecord> rows =
                await _searchService.SearchAsync(criteria, cancellationToken);

            return Ok(rows);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>Returns one operational error row with full stack trace and detail JSON.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OperationalErrorRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOperationalError(Guid id, CancellationToken cancellationToken = default)
    {
        OperationalErrorRecord? row = await _searchService.GetByIdAsync(id, cancellationToken);

        if (row is null)
            return this.NotFoundProblem("Operational error was not found.", ProblemTypes.ResourceNotFound);

        return Ok(row);
    }
}
