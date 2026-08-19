using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>Read-only finding inspector (deterministic persisted explainability).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/findings")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class FindingInspectController(
    IFindingInspectReadRepository findingInspectReadRepository,
    IReasoningSummaryBuilder reasoningSummaryBuilder,
    RunFindingExternalTrackingEnrichmentService runFindingExternalTrackingEnrichmentService,
    IFindingTrustLabelMapper findingTrustLabelMapper,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly IReasoningSummaryBuilder _reasoningSummaryBuilder =
        reasoningSummaryBuilder ?? throw new ArgumentNullException(nameof(reasoningSummaryBuilder));

    private readonly RunFindingExternalTrackingEnrichmentService _runFindingExternalTrackingEnrichmentService =
        runFindingExternalTrackingEnrichmentService
        ?? throw new ArgumentNullException(nameof(runFindingExternalTrackingEnrichmentService));

    private readonly IFindingTrustLabelMapper _findingTrustLabelMapper =
        findingTrustLabelMapper ?? throw new ArgumentNullException(nameof(findingTrustLabelMapper));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>Returns persisted payload, rule linkage, evidence citations, and best-effort audit correlation.</summary>
    /// <param name="findingId">Finding identifier.</param>
    /// <param name="includeTypedPayload">
    ///     When <see langword="false" />, omits relational <c>PayloadJson</c> LOB (detail first-paint path).
    ///     Default <see langword="true" /> keeps full typed payload for inspect / integrations.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("{findingId}/inspect")]
    [ProducesResponseType(typeof(FindingInspectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInspectAsync(
        string findingId,
        [FromQuery] bool includeTypedPayload = true,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        if (findingId.Trim().Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        FindingInspectReadOptions options = includeTypedPayload
            ? FindingInspectReadOptions.Full
            : FindingInspectReadOptions.MetadataOnly;
        FindingInspectResponse? body = await _findingInspectReadRepository.GetInspectAsync(scope, findingId, ct, options);

        if (body is null)
            return this.NotFoundProblem(
                $"Finding '{findingId.Trim()}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        string trimmedFindingId = findingId.Trim();

        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId =
            await _runFindingExternalTrackingEnrichmentService.LoadForFindingsAsync(
                scope.TenantId,
                findingsSnapshotId: null,
                [trimmedFindingId],
                ct);

        trackingByFindingId.TryGetValue(trimmedFindingId, out RunFindingExternalTrackingProjection? tracking);

        return Ok(
            FindingInspectTrustLabelEnricher.Enrich(
                body.WithReasoningSummaryFromBuilder(_reasoningSummaryBuilder)
                    .WithExternalTracking(tracking),
                _findingTrustLabelMapper));
    }
}
