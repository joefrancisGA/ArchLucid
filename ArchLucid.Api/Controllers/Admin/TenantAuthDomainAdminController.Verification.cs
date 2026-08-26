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
    [HttpPost("{normalizedDomain}/verification/start")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartVerificationAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record = await _adminService
            .BeginVerificationAsync(scope.TenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainVerificationStarted,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { normalizedDomain = record.NormalizedDomain })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPost("{normalizedDomain}/verification/check")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckVerificationAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record = await _adminService
            .CheckVerificationAsync(scope.TenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainVerificationChecked,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        verificationStatus = record.VerificationStatus.ToString()
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPost("{normalizedDomain}/routing/test")]
    [MutatingAuditExcluded("Routing preview only; no enforcement mutation.")]
    [ProducesResponseType(typeof(AuthSignInRoutingPreviewResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestRoutingAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRoutingTestRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.TestEmail))
        {
            return this.BadRequestProblem("TestEmail is required.", ProblemTypes.ValidationFailed);
        }

        if (!IdentityEmailNormalizer.TryNormalize(request.TestEmail, out string normalizedEmail, out _))
        {
            return this.BadRequestProblem("Enter a valid test email address.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        AuthSignInRoutingEvaluation evaluation = await _routingService.EvaluateEnforcementPreviewAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = normalizedEmail },
            scope.TenantId,
            normalizedDomain,
            cancellationToken).ConfigureAwait(false);

        return Ok(
            new AuthSignInRoutingPreviewResponse
            {
                SsoRequired = evaluation.SsoRequired,
                AllowEmailCode = evaluation.AllowEmailCode,
                Message = evaluation.SsoRequired ? evaluation.CustomerMessage : null
            });
    }

    [HttpPost("{normalizedDomain}/routing/mark-tested")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkRoutingTestedAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRoutingTestRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.TestEmail))
        {
            return this.BadRequestProblem("TestEmail is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .MarkRoutingTestPassedAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request.TestEmail,
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
                EventType = AuditEventTypes.AuthSignInRoutingEvaluated,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { normalizedDomain = record.NormalizedDomain, routingTestPassed = true })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }
}
