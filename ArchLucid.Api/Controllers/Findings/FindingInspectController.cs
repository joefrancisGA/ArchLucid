using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

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
public sealed partial class FindingInspectController(
    IFindingInspectReadRepository findingInspectReadRepository,
    IReasoningSummaryBuilder reasoningSummaryBuilder,
    RunFindingExternalTrackingEnrichmentService runFindingExternalTrackingEnrichmentService,
    IFindingTrustLabelMapper findingTrustLabelMapper,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IArchitectureShareAccessGate architectureShareAccessGate) : ControllerBase
{
    private readonly IArchitectureShareAccessGate _architectureShareAccessGate =
        architectureShareAccessGate ?? throw new ArgumentNullException(nameof(architectureShareAccessGate));

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

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetInspectAsync(
        string findingId,
        [FromQuery] bool includeTypedPayload = true,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        if (findingId.Trim().Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            string trimmedFindingId = findingId.Trim();
            IActionResult MissingFinding() => this.NotFoundProblem(
                $"Finding '{trimmedFindingId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

            Guid? owner = await _findingInspectReadRepository.GetRunIdByFindingIdAsync(scope, trimmedFindingId, ct);
            if (owner is not Guid runId || runId == Guid.Empty)
                return MissingFinding();

            IActionResult? shareDenied = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
                this, User, scope, runId, ct);
            if (shareDenied is not null)
                return MissingFinding();

            // Bind both projections to the authorized owner, not a fresh latest-run selection.
            FindingInspectReadOptions options = new()
            {
                IncludeTypedPayload = includeTypedPayload,
                ExpectedRunId = runId,
            };
            FindingInspectResponse? body = await _findingInspectReadRepository.GetInspectAsync(
                scope, trimmedFindingId, ct, options);

            if (body is null || body.RunId != runId ||
                !string.Equals(body.FindingId, trimmedFindingId, StringComparison.OrdinalIgnoreCase))
                return MissingFinding();

            IActionResult? sealedGuardResult =
                await EnsureFindingInspectSealedManifestReadAllowedAsync(scope, runId, ct);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            await FindingInspectPinnedEvidenceGuard.EnsureInspectEvidenceInventoryBoundOrThrowAsync(
                body,
                scope,
                _authorityQueryService,
                ct);

            IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId =
                await _runFindingExternalTrackingEnrichmentService.LoadForAuthorizedRunFindingsAsync(
                    scope, runId, [trimmedFindingId], ct);

            trackingByFindingId.TryGetValue(trimmedFindingId, out RunFindingExternalTrackingProjection? tracking);

            return Ok(
                FindingInspectTrustLabelEnricher.Enrich(
                    body.WithReasoningSummaryFromBuilder(_reasoningSummaryBuilder)
                        .WithExternalTracking(tracking),
                    _findingTrustLabelMapper));
        }
        catch (ConflictException ex)
        {
            return MapFindingInspectSealedManifestConflict(ex);
        }
    }
}
