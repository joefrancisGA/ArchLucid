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
    [HttpGet("{normalizedDomain}/recovery-admins")]
    [MutatingAuditExcluded("Read-only recovery administrator list.")]
    [ProducesResponseType(typeof(IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRecoveryAdminsAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> rows =
            await _adminService.ListRecoveryAdminsAsync(scope.TenantId, normalizedDomain, cancellationToken)
                .ConfigureAwait(false);

        return Ok(rows);
    }

    [HttpPost("{normalizedDomain}/recovery-admins")]
    [ProducesResponseType(typeof(TenantSignInEmailDomainRecoveryAdminRecord), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddRecoveryAdminAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRecoveryAdminRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Email))
        {
            return this.BadRequestProblem("Email is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecoveryAdminRecord row;

        try
        {
            row = await _adminService
                .AddRecoveryAdminAsync(scope.TenantId, normalizedDomain, request.Email, actorId, cancellationToken)
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
                EventType = AuditEventTypes.AuthDomainRecoveryAdminAdded,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain,
                        recoveryAdminEmail = row.NormalizedRecoveryAdminEmail
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(row);
    }

    [HttpDelete("{normalizedDomain}/recovery-admins/{normalizedRecoveryAdminEmail}")]
    [ProducesResponseType(typeof(TenantAuthDomainRecoveryAdminRemovalResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveRecoveryAdminAsync(
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        [FromQuery] bool confirmRemoveLast,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantAuthDomainRecoveryAdminRemovalResult result = await _adminService
            .TryRemoveRecoveryAdminAsync(
                scope.TenantId,
                normalizedDomain,
                normalizedRecoveryAdminEmail,
                confirmRemoveLast,
                cancellationToken)
            .ConfigureAwait(false);

        if (!result.Removed)
        {
            return Ok(result);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = result.WasLastRecoveryAdmin
                    ? AuditEventTypes.AuthDomainLastRecoveryPathRemoved
                    : AuditEventTypes.AuthDomainRecoveryAdminRemoved,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { normalizedDomain, recoveryAdminEmail = normalizedRecoveryAdminEmail })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(result);
    }
}
