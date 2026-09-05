using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class AzureBoardsIntegrationsController
{
    // idempotency-posture: dry-run-no-persist
    [HttpPost("test-connection")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AzureBoardsConnectionTestResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestConnectionAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        AzureBoardsConnectionTestResult result =
            await _integrationService.TestConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.IntegrationAzureBoardsConnectionTested,
                ActorUserId = User.Identity?.Name ?? "operator",
                ActorUserName = User.Identity?.Name ?? "operator",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    ok = result.Ok,
                    statusCode = result.StatusCode,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsConnectionTestResponse
        {
            Ok = result.Ok,
            Summary = result.Summary,
            StatusCode = result.StatusCode
        });
    }
}
