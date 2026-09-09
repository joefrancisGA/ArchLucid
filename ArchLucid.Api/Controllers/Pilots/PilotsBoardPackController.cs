using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Pilots;

/// <summary>Quarterly board-pack PDF (Standard tier) — reuses digest + value-report builders.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/pilots")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed partial class PilotsBoardPackController(
    BoardPackPdfBuilder boardPackPdfBuilder,
    IScopeContextProvider scopeContextProvider,
    IRunDetailQueryService runDetailQueryService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : ControllerBase
{
    private readonly BoardPackPdfBuilder _boardPackPdfBuilder =
        boardPackPdfBuilder ?? throw new ArgumentNullException(nameof(boardPackPdfBuilder));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    /// <summary>Builds a quarterly sponsor board pack PDF for the current tenant scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("board-pack.pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostBoardPackPdf(
        [FromBody] BoardPackPdfPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? sealedGuardResult = await EnsureBoardPackSealedManifestReadAllowedAsync(cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
            byte[] pdf = await _boardPackPdfBuilder.BuildPdfAsync(
                body.Year,
                body.Quarter,
                body.PeriodStartUtc,
                body.PeriodEndUtc,
                baseForLinks,
                cancellationToken);

            string name = $"board-pack-Q{body.Quarter}-{body.Year}.pdf";

            return File(pdf, "application/pdf", name);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedHashMismatch
                : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                    ? ProblemTypes.DecisionReceiptSealedIncomplete
                    : ProblemTypes.Conflict;

            return this.ConflictProblem(ex.Message, problemType);
        }
    }
}
