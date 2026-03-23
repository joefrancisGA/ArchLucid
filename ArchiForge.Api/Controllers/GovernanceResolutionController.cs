using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Governance.Resolution;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance-resolution")]
[EnableRateLimiting("fixed")]
public sealed class GovernanceResolutionController(
    IScopeContextProvider scopeProvider,
    IEffectiveGovernanceResolver resolver,
    IAuditService auditService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(EffectiveGovernanceResolutionResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Resolve(CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var result = await resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct).ConfigureAwait(false);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.GovernanceResolutionExecuted,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        decisionCount = result.Decisions.Count,
                        conflictCount = result.Conflicts.Count,
                    }),
            },
            ct).ConfigureAwait(false);

        if (result.Conflicts.Count > 0)
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.GovernanceConflictDetected,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            scope.TenantId,
                            scope.WorkspaceId,
                            scope.ProjectId,
                            conflictCount = result.Conflicts.Count,
                            conflicts = result.Conflicts.Select(c => new
                            {
                                c.ItemType,
                                c.ItemKey,
                                c.ConflictType,
                            }),
                        }),
                },
                ct).ConfigureAwait(false);
        }

        return Ok(result);
    }
}
