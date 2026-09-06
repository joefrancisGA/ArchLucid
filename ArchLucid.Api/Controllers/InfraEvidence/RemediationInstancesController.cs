using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/remediation-instances")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationInstancesController(
    IRemediationInstanceService instanceService,
    IRemediationInstanceQueryService queryService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RemediationInstanceSummary>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] Guid? cloudResourceId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<RemediationInstanceSummary> instances =
            await queryService.ListInstancesAsync(scope, cloudResourceId, cancellationToken);

        return Ok(instances);
    }

    [HttpGet("{instanceId:guid}")]
    [ProducesResponseType(typeof(RemediationInstanceDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid instanceId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceDetail? detail =
            await queryService.TryGetInstanceAsync(scope, instanceId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem("Remediation instance was not found.", ProblemTypes.ResourceNotFound);

        return Ok(detail);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation instance creation delegates to RemediationInstanceService audit events.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] RemediationInstanceCreateRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.FindingId == Guid.Empty)
            return this.BadRequestProblem("FindingId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.CreateFromMatchAsync(
            scope,
            request.FindingId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result);
    }

    [HttpPost("{instanceId:guid}/preflight")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation preflight delegates to RemediationInstanceService.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Preflight(
        Guid instanceId,
        [FromBody] RemediationInstancePreflightRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.InventorySnapshotId == Guid.Empty)
            return this.BadRequestProblem("InventorySnapshotId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.RunPreflightAsync(
            scope,
            instanceId,
            request.InventorySnapshotId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    [HttpPost("{instanceId:guid}/approve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation approval delegates to RemediationInstanceService.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(Guid instanceId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.ApproveAsync(
            scope,
            instanceId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    [HttpPost("{instanceId:guid}/assign-wave")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation wave assignment delegates to RemediationInstanceService.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignWave(
        Guid instanceId,
        [FromBody] RemediationInstanceAssignWaveRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.WaveId == Guid.Empty)
            return this.BadRequestProblem("WaveId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.AssignWaveAsync(
            scope,
            instanceId,
            request.WaveId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    [HttpPost("{instanceId:guid}/execute")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation execute emits advisory artifacts only; no terraform apply.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Execute(
        Guid instanceId,
        [FromBody] RemediationInstanceExecuteRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.InventorySnapshotId == Guid.Empty)
            return this.BadRequestProblem("InventorySnapshotId is required.", ProblemTypes.ValidationFailed);

        string correlationId = string.IsNullOrWhiteSpace(request.CorrelationId)
            ? Guid.NewGuid().ToString("D")
            : request.CorrelationId.Trim();

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.ExecuteAsync(
            scope,
            instanceId,
            request.InventorySnapshotId,
            actorContext.GetActorId(),
            correlationId,
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    [HttpPost("{instanceId:guid}/verify")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation verification delegates to RemediationInstanceService.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Verify(
        Guid instanceId,
        [FromBody] RemediationInstanceVerifyRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.VerificationSnapshotId == Guid.Empty)
            return this.BadRequestProblem("VerificationSnapshotId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.VerifyAsync(
            scope,
            instanceId,
            request.VerificationSnapshotId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    [HttpPost("{instanceId:guid}/close")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation close delegates to RemediationInstanceService.")]
    [ProducesResponseType(typeof(RemediationInstanceOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Close(Guid instanceId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationInstanceOperationResult result = await instanceService.CloseAsync(
            scope,
            instanceId,
            actorContext.GetActorId(),
            cancellationToken);

        return MapOperationResult(result, instanceId);
    }

    private IActionResult MapOperationResult(
        RemediationInstanceOperationResult result,
        Guid? expectedInstanceId = null)
    {
        if (expectedInstanceId.HasValue
            && result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
        {
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Remediation instance was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (!result.Succeeded && result.Blockers.Count > 0)
            return Ok(result);

        if (!result.Succeeded)
            return this.BadRequestProblem(
                result.ErrorMessage ?? "Remediation instance operation failed.",
                ProblemTypes.ValidationFailed);

        return Ok(result);
    }
}
