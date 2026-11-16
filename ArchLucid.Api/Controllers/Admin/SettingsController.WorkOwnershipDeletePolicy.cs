using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class SettingsController
{
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
        (string actorUserId, string actorUserName) = GetAuditActorFields();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantWorkOwnershipDeletePolicyUpdated,
                ExplicitActor = true,
                ActorUserId = actorUserId,
                ActorUserName = actorUserName,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { allowCreatorDeleteOwnedWork = allowCreatorDelete }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(new TenantWorkOwnershipDeletePolicyResponse { AllowCreatorDeleteOwnedWork = allowCreatorDelete });
    }
}
