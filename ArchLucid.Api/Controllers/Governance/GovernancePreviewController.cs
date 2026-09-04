using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Read-only governance preview: compare manifest governance for hypothetical activation or between environments.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance-preview")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed class GovernancePreviewController(
    IGovernancePreviewService previewService,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    ILogger<GovernancePreviewController> logger) : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Preview governance diff if the given run/manifest were activated into an environment (no persistence).</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("preview")]
    [ProducesResponseType(typeof(GovernancePreviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Preview(
        [FromBody] CreateGovernancePreviewRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? runIdProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(body.RunId)
                .ToBadRequestProblemOrNull(this);

        if (runIdProblem is not null)
            return runIdProblem;

        if (!Guid.TryParse(body.RunId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
        {
            return this.BadRequestProblem("runId is not valid.", ProblemTypes.ValidationFailed);
        }

        IActionResult? manifestVersionProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateManifestVersion(body.ManifestVersion)
                .ToBadRequestProblemOrNull(this);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? environmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(body.Environment, "Environment")
                .ToBadRequestProblemOrNull(this);

        if (environmentProblem is not null)
            return environmentProblem;

        IActionResult? previewValidationProblem =
            GovernancePreviewHttpMapper.Validate(body).ToBadRequestProblemOrNull(this);

        if (previewValidationProblem is not null)
            return previewValidationProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            GovernancePreviewRequest request = new()
            {
                RunId = body.RunId, ManifestVersion = body.ManifestVersion, Environment = body.Environment
            };
            GovernancePreviewResult result = await previewService.PreviewActivationAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Preview failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GoldenManifestVersionNotFoundException ex)
        {
            logger.LogWarning(ex, "Preview failed: manifest version not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ManifestNotFound);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Preview failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            logger.LogWarning(ex, "Preview blocked: sealed manifest verification failed.");
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Preview failed: invalid operation.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
    }

    /// <summary>Compare governance between the currently active manifests in two environments (read-only).</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("compare-environments")]
    [ProducesResponseType(typeof(GovernanceEnvironmentComparisonResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompareEnvironments(
        [FromBody] CreateGovernanceEnvironmentComparisonRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? sourceEnvironmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(body.SourceEnvironment, "SourceEnvironment")
                .ToBadRequestProblemOrNull(this);

        if (sourceEnvironmentProblem is not null)
            return sourceEnvironmentProblem;

        IActionResult? targetEnvironmentProblem =
            GovernanceApprovalRequestsHttpMapper.ValidateEnvironmentSlug(body.TargetEnvironment, "TargetEnvironment")
                .ToBadRequestProblemOrNull(this);

        if (targetEnvironmentProblem is not null)
            return targetEnvironmentProblem;

        IActionResult? comparisonValidationProblem =
            GovernanceEnvironmentComparisonHttpMapper.Validate(body).ToBadRequestProblemOrNull(this);

        if (comparisonValidationProblem is not null)
            return comparisonValidationProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;


        try
        {
            GovernanceEnvironmentComparisonRequest request = new()
            {
                SourceEnvironment = body.SourceEnvironment, TargetEnvironment = body.TargetEnvironment
            };
            GovernanceEnvironmentComparisonResult result =
                await previewService.CompareEnvironmentsAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "CompareEnvironments failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            logger.LogWarning(ex, "CompareEnvironments blocked: sealed manifest verification failed.");
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    private async Task<IActionResult?> RequireTenantAndWorkspaceOrNotFoundAsync(CancellationToken cancellationToken)
    {
        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return problem;
    }
}
