using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/remediation-waves")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationWavesController(
    IRemediationWaveService waveService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation wave creation is tenant-scoped orchestration metadata.")]
    [ProducesResponseType(typeof(RemediationWaveOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] RemediationWaveCreateRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
            return this.BadRequestProblem("Wave name is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationWaveOperationResult result = await waveService.CreateWaveAsync(
            scope,
            request.Name,
            request.TargetSize,
            request.ExplicitCloudResourceIds,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Wave creation failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RemediationWaveRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        return Ok(await waveService.ListWavesAsync(scope, cancellationToken));
    }

    [HttpGet("{waveId:guid}")]
    [ProducesResponseType(typeof(RemediationWaveDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid waveId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationWaveDetail? detail = await waveService.GetWaveAsync(scope, waveId, cancellationToken);

        if (detail is null)
            return NotFound();

        return Ok(detail);
    }
}
