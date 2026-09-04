using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("risk-exceptions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RiskExceptionRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionCreated via IAuditService.")]
    public async Task<IActionResult> CreateRiskException(
        [FromBody] CreateRiskExceptionRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? createValidation =
            GovernanceStickinessHttpMapper.ValidateCreateRiskException(request!).ToBadRequestProblemOrNull(this);

        if (createValidation is not null)
            return createValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            RiskExceptionRecord record = await _facade.CreateRiskExceptionAsync(request!, cancellationToken);

            return Ok(record);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (GoldenManifestVersionNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ManifestNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("risk-exceptions")]
    [ProducesResponseType(typeof(IReadOnlyList<RiskExceptionRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListRiskExceptions(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        IActionResult? projectIdProblem =
            GovernanceStickinessControllerCore.ValidateProjectScopedQuery(projectId)
                .ToBadRequestProblemOrNull(this);

        if (projectIdProblem is not null)
            return projectIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyList<RiskExceptionRecord> records =
            await _facade.ListRiskExceptionsAsync(projectId, cancellationToken);

        return Ok(records);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("risk-exceptions/{riskExceptionId:guid}/revoke")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionRevoked via IAuditService.")]
    public async Task<IActionResult> RevokeRiskException(Guid riskExceptionId, CancellationToken cancellationToken = default)
    {
        IActionResult? routeValidation =
            GovernanceStickinessHttpMapper.ValidateRouteGuid(riskExceptionId, "riskExceptionId")
                .ToBadRequestProblemOrNull(this);

        if (routeValidation is not null)
            return routeValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            await _facade.RevokeRiskExceptionAsync(riskExceptionId, cancellationToken);

            return NoContent();
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("risk-exceptions/{riskExceptionId:guid}/renew")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RiskExceptionRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IRiskExceptionService logs RiskExceptionRenewed via IAuditService.")]
    public async Task<IActionResult> RenewRiskException(
        Guid riskExceptionId,
        [FromBody] RenewRiskExceptionRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? routeValidation =
            GovernanceStickinessHttpMapper.ValidateRouteGuid(riskExceptionId, "riskExceptionId")
                .ToBadRequestProblemOrNull(this);

        if (routeValidation is not null)
            return routeValidation;

        IActionResult? renewValidation =
            GovernanceStickinessHttpMapper.ValidateRenewRiskException(request!).ToBadRequestProblemOrNull(this);

        if (renewValidation is not null)
            return renewValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            RiskExceptionRecord record =
                await _facade.RenewRiskExceptionAsync(riskExceptionId, request!, cancellationToken);

            return Ok(record);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }
}
