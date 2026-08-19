using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Tenant-scoped user invitation admin APIs (TB-793).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/users")]
public sealed class UsersAdminController(
    IUserInvitationAdminService invitationAdminService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly IUserInvitationAdminService _invitationAdminService =
        invitationAdminService ?? throw new ArgumentNullException(nameof(invitationAdminService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("invite")]
    [ProducesResponseType(typeof(UserInvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InviteAsync(
        [FromBody] CreateUserInvitationRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        try
        {
            UserInvitationResponse response = await _invitationAdminService.InviteAsync(
                scope,
                actorId,
                request,
                cancellationToken);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AdminUserInvitationCreated,
                    ActorUserId = actorId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            invitationId = response.Id,
                            email = response.Email,
                            appRole = response.AppRole,
                            expiresUtc = response.ExpiresUtc
                        })
                },
                cancellationToken);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (UserInvitationDirectoryUserExistsException ex)
        {
            return this.ConflictProblem(
                $"A directory user already exists for '{ex.Email}'.",
                ProblemTypes.Conflict);
        }
    }

    [HttpGet("invitations")]
    [ProducesResponseType(typeof(UserInvitationListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListInvitationsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<UserInvitationResponse> invitations =
            await _invitationAdminService.ListAsync(scope, cancellationToken);

        return Ok(new UserInvitationListResponse { Invitations = invitations });
    }

    [HttpDelete("invitations/{invitationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeInvitationAsync(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        bool revoked = await _invitationAdminService.RevokeAsync(scope, invitationId, cancellationToken);

        if (!revoked)
        {
            return this.NotFoundProblem(
                "Invitation was not found or is no longer pending.",
                ProblemTypes.ResourceNotFound);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdminUserInvitationRevoked,
                ActorUserId = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { invitationId })
            },
            cancellationToken);

        return NoContent();
    }
}
