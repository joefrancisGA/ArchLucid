using System.Text.Json;

using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class SettingsController
{
    /// <summary>Whether creators may delete or archive their own unsealed architectures and in-flight reviews.</summary>
    [HttpGet("work-ownership-delete-policy")]
    [ProducesResponseType(typeof(TenantWorkOwnershipDeletePolicyResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantWorkOwnershipDeletePolicyResponse>> GetWorkOwnershipDeletePolicy(
        CancellationToken cancellationToken)
    {
        bool allowCreatorDelete = await _workOwnershipDeletePolicyService
            .GetAllowCreatorDeleteOwnedWorkAsync(cancellationToken)
            .ConfigureAwait(false);

        return Ok(new TenantWorkOwnershipDeletePolicyResponse { AllowCreatorDeleteOwnedWork = allowCreatorDelete });
    }

    /// <summary>Enable or disable creator delete/archive for unsealed work (admins always retain delete rights).</summary>
    [HttpPut("work-ownership-delete-policy")]
    [ProducesResponseType(typeof(TenantWorkOwnershipDeletePolicyResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> PutWorkOwnershipDeletePolicy(
        [FromBody] TenantWorkOwnershipDeletePolicyUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        bool allowCreatorDelete = await _workOwnershipDeletePolicyService
            .SetAllowCreatorDeleteOwnedWorkAsync(request.AllowCreatorDeleteOwnedWork, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantWorkOwnershipDeletePolicyUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { allowCreatorDeleteOwnedWork = allowCreatorDelete }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(new TenantWorkOwnershipDeletePolicyResponse { AllowCreatorDeleteOwnedWork = allowCreatorDelete });
    }
}
