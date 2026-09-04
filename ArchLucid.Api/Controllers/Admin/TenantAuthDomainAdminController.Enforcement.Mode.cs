using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class TenantAuthDomainAdminController
{
    [HttpPut("{normalizedDomain}/enforcement")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetEnforcementAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainEnforcementRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .SetEnforcementModeAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request.EnforcementMode,
                    request.AllowEmailOtpRecovery,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainEnforcementModeChanged,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        enforcementMode = record.EnforcementMode.ToString(),
                        allowEmailOtpRecovery = record.AllowEmailOtpRecovery
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPost("{normalizedDomain}/enforcement/enable")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> EnableEnforcementAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainEnableEnforcementRequest request,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .EnableEnforcementAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request?.ConfirmTested ?? false,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainEnforcementEnabled,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        enforcementMode = record.EnforcementMode.ToString()
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpGet("{normalizedDomain}/enforcement-readiness")]
    [MutatingAuditExcluded("Read-only enforcement readiness checklist.")]
    [ProducesResponseType(typeof(TenantAuthDomainEnforcementReadiness), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnforcementReadinessAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            TenantAuthDomainEnforcementReadiness readiness = await _adminService
                .GetEnforcementReadinessAsync(scope.TenantId, normalizedDomain, cancellationToken)
                .ConfigureAwait(false);

            return Ok(readiness);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
