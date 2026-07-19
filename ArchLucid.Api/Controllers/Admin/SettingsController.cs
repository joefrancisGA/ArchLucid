using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Per-tenant admin settings overrides (requires <see cref="ArchLucidPolicies.AdminAuthority" />).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/settings")]
public sealed class SettingsController(
    ITenantAgentOutputQualityGateModeService qualityGateModeService,
    IWorkspaceModelExecutionProfileService workspaceModelExecutionProfileService,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly ITenantAgentOutputQualityGateModeService _qualityGateModeService =
        qualityGateModeService ?? throw new ArgumentNullException(nameof(qualityGateModeService));

    private readonly IWorkspaceModelExecutionProfileService _workspaceModelExecutionProfileService =
        workspaceModelExecutionProfileService ?? throw new ArgumentNullException(nameof(workspaceModelExecutionProfileService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Effective <c>AgentOutput:QualityGate:Mode</c> for the active tenant (host default or tenant override).</summary>
    [HttpGet("agent-output-quality-gate-mode")]
    [ProducesResponseType(typeof(TenantAgentOutputQualityGateModeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantAgentOutputQualityGateModeResponse>> GetAgentOutputQualityGateMode(
        CancellationToken cancellationToken)
    {
        TenantAgentOutputQualityGateModeSnapshot snapshot =
            await _qualityGateModeService.GetAsync(cancellationToken).ConfigureAwait(false);

        return Ok(Map(snapshot));
    }

    /// <summary>Persist tenant override for <c>AgentOutput:QualityGate:Mode</c> (<c>WarnOnly</c> or <c>PilotStrict</c>).</summary>
    [HttpPut("agent-output-quality-gate-mode")]
    [ProducesResponseType(typeof(TenantAgentOutputQualityGateModeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAgentOutputQualityGateMode(
        [FromBody] TenantAgentOutputQualityGateModeUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!Enum.TryParse(request.Mode, ignoreCase: true, out AgentOutputQualityGateMode mode)
            || !Enum.IsDefined(mode))
        {
            return this.BadRequestProblem(
                "Mode must be WarnOnly or PilotStrict.",
                ProblemTypes.ValidationFailed);
        }

        TenantAgentOutputQualityGateModeSnapshot snapshot =
            await _qualityGateModeService.SetAsync(mode, cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantAgentOutputQualityGateModeUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { effectiveMode = snapshot.EffectiveMode.ToString() })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(Map(snapshot));
    }

    /// <summary>Remove tenant override so the host-configured mode applies.</summary>
    [HttpDelete("agent-output-quality-gate-mode")]
    [ProducesResponseType(typeof(TenantAgentOutputQualityGateModeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantAgentOutputQualityGateModeResponse>> DeleteAgentOutputQualityGateMode(
        CancellationToken cancellationToken)
    {
        TenantAgentOutputQualityGateModeSnapshot snapshot =
            await _qualityGateModeService.ClearOverrideAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantAgentOutputQualityGateModeOverrideCleared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { effectiveMode = snapshot.EffectiveMode.ToString() })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(Map(snapshot));
    }

    /// <summary>Effective workspace default model execution profile for the active tenant.</summary>
    [HttpGet("model-execution-profile")]
    [ProducesResponseType(typeof(WorkspaceModelExecutionProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceModelExecutionProfileResponse>> GetModelExecutionProfile(
        CancellationToken cancellationToken)
    {
        WorkspaceModelExecutionProfileSnapshot snapshot =
            await _workspaceModelExecutionProfileService.GetAsync(cancellationToken).ConfigureAwait(false);

        return Ok(MapModelExecutionProfile(snapshot));
    }

    /// <summary>Persist tenant override for the workspace default model execution profile.</summary>
    [HttpPut("model-execution-profile")]
    [ProducesResponseType(typeof(WorkspaceModelExecutionProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutModelExecutionProfile(
        [FromBody] WorkspaceModelExecutionProfileUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!AgentModelExecutionProfileParser.TryParse(request.Profile, out AgentModelExecutionProfile profile))
        {
            return this.BadRequestProblem(
                "Profile must be Economy, Balanced, or HighAssurance.",
                ProblemTypes.ValidationFailed);
        }

        WorkspaceModelExecutionProfileSnapshot before =
            await _workspaceModelExecutionProfileService.GetAsync(cancellationToken).ConfigureAwait(false);

        WorkspaceModelExecutionProfileSnapshot snapshot =
            await _workspaceModelExecutionProfileService.SetAsync(profile, cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceModelExecutionProfileUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        beforeProfile = AgentModelExecutionProfileParser.Format(before.EffectiveProfile),
                        afterProfile = AgentModelExecutionProfileParser.Format(snapshot.EffectiveProfile)
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapModelExecutionProfile(snapshot));
    }

    /// <summary>Remove tenant override so the workspace default profile applies.</summary>
    [HttpDelete("model-execution-profile")]
    [ProducesResponseType(typeof(WorkspaceModelExecutionProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceModelExecutionProfileResponse>> DeleteModelExecutionProfile(
        CancellationToken cancellationToken)
    {
        WorkspaceModelExecutionProfileSnapshot snapshot =
            await _workspaceModelExecutionProfileService.ClearOverrideAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceModelExecutionProfileOverrideCleared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { effectiveProfile = AgentModelExecutionProfileParser.Format(snapshot.EffectiveProfile) })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapModelExecutionProfile(snapshot));
    }

    private static TenantAgentOutputQualityGateModeResponse Map(TenantAgentOutputQualityGateModeSnapshot snapshot) =>
        new()
        {
            EffectiveMode = snapshot.EffectiveMode.ToString(),
            Source = snapshot.Source.ToString(),
            HostDefaultMode = snapshot.HostDefaultMode.ToString()
        };

    private static WorkspaceModelExecutionProfileResponse MapModelExecutionProfile(
        WorkspaceModelExecutionProfileSnapshot snapshot) =>
        new()
        {
            EffectiveProfile = AgentModelExecutionProfileParser.Format(snapshot.EffectiveProfile),
            Source = snapshot.Source.ToString(),
            WorkspaceDefaultProfile = AgentModelExecutionProfileParser.Format(AgentModelExecutionProfile.Balanced)
        };
}
