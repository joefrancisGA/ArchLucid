using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/roles")]
public sealed class CustomRolesAdminController(
    ICustomRoleService customRoleService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IActorContext actorContext,
    ILogger<CustomRolesAdminController> logger) : ControllerBase
{
    private readonly ICustomRoleService _customRoleService =
        customRoleService ?? throw new ArgumentNullException(nameof(customRoleService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ILogger<CustomRolesAdminController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CustomRoleResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<CustomRoleRecord> rows = await _customRoleService.ListAsync(cancellationToken);

        return Ok(rows.Select(CustomRoleResponse.FromRecord).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomRoleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAsync(
        [FromBody] CustomRoleUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!IsValidUnicodeText(body.Name) || !IsValidUnicodeText(body.Description))
            return this.BadRequestProblem(
                "Role name and description must be valid Unicode text.",
                ProblemTypes.ValidationFailed);

        try
        {
            CustomRoleRecord created = await _customRoleService.CreateAsync(
                body.Name,
                body.Description,
                body.Permissions ?? [],
                cancellationToken);

            ScopeContext scope = _scopeProvider.GetCurrentScope();

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IdentityCustomRoleCreated,
                    ActorUserId = _actorContext.GetActorId(),
                    ActorUserName = _actorContext.GetActor(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new { roleId = created.Id, created.Name, permissions = created.Permissions }),
                },
                cancellationToken);

            return CreatedAtAction(nameof(ListAsync), CustomRoleResponse.FromRecord(created));
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (JsonException)
        {
            return this.BadRequestProblem(
                "Role name or description is not valid JSON-safe text.",
                ProblemTypes.ValidationFailed);
        }
    }

    [HttpPut("{roleId:guid}")]
    [ProducesResponseType(typeof(CustomRoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(
        Guid roleId,
        [FromBody] CustomRoleUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            CustomRoleRecord updated = await _customRoleService.UpdateAsync(
                roleId,
                body.Name,
                body.Description,
                body.Permissions ?? [],
                cancellationToken);

            ScopeContext scope = _scopeProvider.GetCurrentScope();

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IdentityCustomRoleUpdated,
                    ActorUserId = _actorContext.GetActorId(),
                    ActorUserName = _actorContext.GetActor(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new { roleId = updated.Id, updated.Name, permissions = updated.Permissions }),
                },
                cancellationToken);

            return Ok(CustomRoleResponse.FromRecord(updated));
        }
        catch (KeyNotFoundException)
        {
            return this.NotFoundProblem(
                $"Custom role '{roleId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpPost("{roleId:guid}/assign")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignAsync(
        Guid roleId,
        [FromBody] CustomRoleAssignRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null || body.UserId == Guid.Empty)
            return this.BadRequestProblem("userId is required.", ProblemTypes.ValidationFailed);

        try
        {
            await _customRoleService.AssignAsync(roleId, body.UserId, cancellationToken);

            ScopeContext scope = _scopeProvider.GetCurrentScope();

            AuditEvent assignedAudit = new()
            {
                EventType = AuditEventTypes.IdentityCustomRoleAssigned,
                ActorUserId = _actorContext.GetActorId(),
                ActorUserName = _actorContext.GetActor(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { roleId, userId = body.UserId }),
            };

            await DurableAuditLogRetry.LogOrThrowAsync(
                ct => _auditService.LogAsync(assignedAudit, ct),
                _logger,
                $"IdentityCustomRoleAssigned:{roleId:N}",
                cancellationToken,
                auditEventTypeForMetrics: assignedAudit.EventType);

            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return this.NotFoundProblem(
                $"Custom role '{roleId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }
    }

    private static bool IsValidUnicodeText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return true;

        for (int i = 0; i < value.Length; i++)
        {
            if (!char.IsSurrogate(value[i]))
                continue;

            if (i + 1 >= value.Length || !char.IsSurrogatePair(value[i], value[i + 1]))
                return false;

            i++;
        }

        return true;
    }
}

public sealed class CustomRoleUpsertRequest
{
    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public IReadOnlyList<string>? Permissions
    {
        get;
        init;
    }
}

public sealed class CustomRoleAssignRequest
{
    public Guid UserId
    {
        get;
        init;
    }
}

public sealed class CustomRoleResponse
{
    public Guid Id
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public IReadOnlyList<string> Permissions
    {
        get;
        init;
    } = [];

    public bool IsSystem
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }

    public static CustomRoleResponse FromRecord(CustomRoleRecord record)
    {
        return new CustomRoleResponse
        {
            Id = record.Id,
            Name = record.Name,
            Description = record.Description,
            Permissions = record.Permissions,
            IsSystem = record.IsSystem,
            UpdatedUtc = record.UpdatedUtc,
        };
    }
}
