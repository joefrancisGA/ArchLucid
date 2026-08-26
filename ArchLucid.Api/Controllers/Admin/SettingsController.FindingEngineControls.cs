using System.Text.Json;

using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class SettingsController
{
    /// <summary>Effective finding-engine controls for the active tenant (host defaults or tenant overrides).</summary>
    [HttpGet("finding-engine-controls")]
    [ProducesResponseType(typeof(TenantFindingEngineControlsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantFindingEngineControlsResponse>> GetFindingEngineControls(
        CancellationToken cancellationToken)
    {
        TenantFindingEngineControlsSnapshot snapshot =
            await _findingEngineControlsService.GetAsync(cancellationToken).ConfigureAwait(false);

        return Ok(MapFindingEngineControls(snapshot));
    }

    /// <summary>Persist tenant overrides for insight-density LLM judge and portfolio recurrence engines.</summary>
    [HttpPut("finding-engine-controls")]
    [ProducesResponseType(typeof(TenantFindingEngineControlsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> PutFindingEngineControls(
        [FromBody] TenantFindingEngineControlsUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        TenantFindingEngineControlsSnapshot snapshot = await _findingEngineControlsService
            .SetAsync(
                request.EnableLlmJudge,
                request.EnableLlmJudgeForEngineFindings,
                request.PortfolioRecurrenceEnabled,
                cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantFindingEngineControlsUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    enableLlmJudge = snapshot.EffectiveEnableLlmJudge,
                    enableLlmJudgeForEngineFindings = snapshot.EffectiveEnableLlmJudgeForEngineFindings,
                    portfolioRecurrenceEnabled = snapshot.EffectivePortfolioRecurrenceEnabled,
                })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapFindingEngineControls(snapshot));
    }

    /// <summary>Remove tenant overrides so host-configured finding-engine defaults apply.</summary>
    [HttpDelete("finding-engine-controls")]
    [ProducesResponseType(typeof(TenantFindingEngineControlsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantFindingEngineControlsResponse>> DeleteFindingEngineControls(
        CancellationToken cancellationToken)
    {
        TenantFindingEngineControlsSnapshot snapshot =
            await _findingEngineControlsService.ClearOverridesAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantFindingEngineControlsOverridesCleared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    enableLlmJudge = snapshot.EffectiveEnableLlmJudge,
                    enableLlmJudgeForEngineFindings = snapshot.EffectiveEnableLlmJudgeForEngineFindings,
                    portfolioRecurrenceEnabled = snapshot.EffectivePortfolioRecurrenceEnabled,
                })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapFindingEngineControls(snapshot));
    }

    private static TenantFindingEngineControlsResponse MapFindingEngineControls(
        TenantFindingEngineControlsSnapshot snapshot) =>
        new()
        {
            EffectiveEnableLlmJudge = snapshot.EffectiveEnableLlmJudge,
            EffectiveEnableLlmJudgeForEngineFindings = snapshot.EffectiveEnableLlmJudgeForEngineFindings,
            EffectivePortfolioRecurrenceEnabled = snapshot.EffectivePortfolioRecurrenceEnabled,
            HostDefaultEnableLlmJudge = snapshot.HostDefaultEnableLlmJudge,
            HostDefaultEnableLlmJudgeForEngineFindings = snapshot.HostDefaultEnableLlmJudgeForEngineFindings,
            HostDefaultPortfolioRecurrenceEnabled = snapshot.HostDefaultPortfolioRecurrenceEnabled,
            EnableLlmJudgeOverridden = snapshot.EnableLlmJudgeOverridden,
            EnableLlmJudgeForEngineFindingsOverridden = snapshot.EnableLlmJudgeForEngineFindingsOverridden,
            PortfolioRecurrenceEnabledOverridden = snapshot.PortfolioRecurrenceEnabledOverridden,
        };
}
