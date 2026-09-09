using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP API for structured golden-manifest comparison between two runs in the caller’s scope (base → target).
/// </summary>
/// <remarks>
///     Uses <see cref="ICompareRunsApplicationFacade.CompareManifestsAsync" /> for scoped manifest loading and
///     comparison. For flat diff lists, see <c>api/authority/compare</c>.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/compare")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ComparisonController(
    ICompareRunsApplicationFacade compareRunsFacade,
    IAuthorityQueryService authorityQueryService,
    IScopeContextProvider scopeContextProvider,
    IManifestHashService manifestHashService) : ControllerBase
{
    private readonly ICompareRunsApplicationFacade _compareRunsFacade =
        compareRunsFacade ?? throw new ArgumentNullException(nameof(compareRunsFacade));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    /// <summary>Structured <see cref="ManifestDocument" /> delta between two runs (base → target).</summary>
    /// <param name="baseRunId">Earlier or baseline run.</param>
    /// <param name="targetRunId">Later or candidate run.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    ///     <see cref="ComparisonResult" /> when both runs exist in scope and each has a golden manifest; otherwise 404.
    ///     Delta collections are non-null JSON arrays (empty when no changes). <see cref="ComparisonResult.TotalDeltaCount" />
    ///     is the sum of row counts across sections.
    /// </returns>
    [HttpGet]
    [ProducesResponseType(typeof(ComparisonResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareRuns(
        [FromQuery] Guid baseRunId,
        [FromQuery] Guid targetRunId,
        CancellationToken ct = default)
    {
        IActionResult? sealedGuardResult =
            await EnsureCompareRunsSealedManifestReadAllowedAsync(baseRunId, targetRunId, ct);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ManifestCompareLoadResult result = await _compareRunsFacade.CompareManifestsAsync(baseRunId, targetRunId, ct);

        return result.Outcome switch
        {
            ManifestCompareLoadOutcome.Success => Ok(result.Comparison),
            ManifestCompareLoadOutcome.BaseRunNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.TargetRunNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.BaseManifestNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' does not have a committed golden manifest.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.TargetManifestNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' does not have a committed golden manifest.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.BaseLifecycleIncomplete => this.ConflictProblem(
                $"Run '{result.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.TargetLifecycleIncomplete => this.ConflictProblem(
                $"Run '{result.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.PinFingerprintMismatch => this.ConflictProblem(
                "Compare blocked: create-time pin fingerprints differ between the selected runs.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch => this.ConflictProblem(
                "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
                ProblemTypes.CommittedArtifactInventoryMismatch),
            ManifestCompareLoadOutcome.SealedManifestHashMismatch => this.ConflictProblem(
                "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected manifest compare outcome: {result.Outcome}."),
        };
    }
}
