using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

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
    ITenantFindingEngineControlsService findingEngineControlsService,
    IWorkspaceModelExecutionProfileService workspaceModelExecutionProfileService,
    IWorkspaceAllowedEngineSetService workspaceAllowedEngineSetService,
    IExternalSubprocessorEngineAcknowledgmentService externalSubprocessorEngineAcknowledgmentService,
    IAgentModelAliasRegistry agentModelAliasRegistry,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IAuditRepository auditRepository,
    TimeProvider timeProvider) : ControllerBase
{
    private readonly ITenantAgentOutputQualityGateModeService _qualityGateModeService =
        qualityGateModeService ?? throw new ArgumentNullException(nameof(qualityGateModeService));

    private readonly ITenantFindingEngineControlsService _findingEngineControlsService =
        findingEngineControlsService ?? throw new ArgumentNullException(nameof(findingEngineControlsService));

    private readonly IWorkspaceModelExecutionProfileService _workspaceModelExecutionProfileService =
        workspaceModelExecutionProfileService ?? throw new ArgumentNullException(nameof(workspaceModelExecutionProfileService));

    private readonly IWorkspaceAllowedEngineSetService _workspaceAllowedEngineSetService =
        workspaceAllowedEngineSetService ?? throw new ArgumentNullException(nameof(workspaceAllowedEngineSetService));

    private readonly IExternalSubprocessorEngineAcknowledgmentService _externalSubprocessorEngineAcknowledgmentService =
        externalSubprocessorEngineAcknowledgmentService
        ?? throw new ArgumentNullException(nameof(externalSubprocessorEngineAcknowledgmentService));

    private readonly IAgentModelAliasRegistry _agentModelAliasRegistry =
        agentModelAliasRegistry ?? throw new ArgumentNullException(nameof(agentModelAliasRegistry));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

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
        string actor = User?.Identity?.Name ?? "admin";

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

    /// <summary>Remove tenant override so the host-configured mode applies.</summary>
    [HttpDelete("agent-output-quality-gate-mode")]
    [ProducesResponseType(typeof(TenantAgentOutputQualityGateModeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantAgentOutputQualityGateModeResponse>> DeleteAgentOutputQualityGateMode(
        CancellationToken cancellationToken)
    {
        TenantAgentOutputQualityGateModeSnapshot snapshot =
            await _qualityGateModeService.ClearOverrideAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

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

        return Ok(await MapModelExecutionProfileAsync(snapshot, cancellationToken).ConfigureAwait(false));
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
        string actor = User?.Identity?.Name ?? "admin";

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

        return Ok(await MapModelExecutionProfileAsync(snapshot, cancellationToken).ConfigureAwait(false));
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
        string actor = User?.Identity?.Name ?? "admin";

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

        return Ok(await MapModelExecutionProfileAsync(snapshot, cancellationToken).ConfigureAwait(false));
    }

    /// <summary>Workspace allowed engine alias set for per-review selection (TB-2110).</summary>
    [HttpGet("allowed-engine-set")]
    [ProducesResponseType(typeof(WorkspaceAllowedEngineSetResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceAllowedEngineSetResponse>> GetAllowedEngineSet(
        CancellationToken cancellationToken)
    {
        WorkspaceAllowedEngineSetSnapshot snapshot =
            await _workspaceAllowedEngineSetService.GetAsync(cancellationToken).ConfigureAwait(false);

        return Ok(MapAllowedEngineSet(snapshot));
    }

    /// <summary>Persist tenant override for allowed engine aliases + default (TB-2110).</summary>
    [HttpPut("allowed-engine-set")]
    [ProducesResponseType(typeof(WorkspaceAllowedEngineSetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAllowedEngineSet(
        [FromBody] WorkspaceAllowedEngineSetUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.AllowedAliasIds.Count == 0 || string.IsNullOrWhiteSpace(request.DefaultAliasId))
        {
            return this.BadRequestProblem(
                "AllowedAliasIds and DefaultAliasId are required.",
                ProblemTypes.ValidationFailed);
        }

        WorkspaceAllowedEngineSetSnapshot before =
            await _workspaceAllowedEngineSetService.GetAsync(cancellationToken).ConfigureAwait(false);

        WorkspaceAllowedEngineSetSnapshot snapshot;

        try
        {
            snapshot = await _workspaceAllowedEngineSetService
                .SetAsync(
                    new WorkspaceAllowedEngineSetSnapshot(
                        request.AllowedAliasIds.ToList(),
                        request.DefaultAliasId.Trim(),
                        WorkspaceAllowedEngineSetSource.TenantOverride),
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceAllowedEngineSetUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        beforeAllowed = before.AllowedAliasIds,
                        beforeDefault = before.DefaultAliasId,
                        afterAllowed = snapshot.AllowedAliasIds,
                        afterDefault = snapshot.DefaultAliasId
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapAllowedEngineSet(snapshot));
    }

    /// <summary>Remove tenant override so catalog defaults apply (TB-2110).</summary>
    [HttpDelete("allowed-engine-set")]
    [ProducesResponseType(typeof(WorkspaceAllowedEngineSetResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceAllowedEngineSetResponse>> DeleteAllowedEngineSet(
        CancellationToken cancellationToken)
    {
        WorkspaceAllowedEngineSetSnapshot snapshot =
            await _workspaceAllowedEngineSetService.ClearOverrideAsync(cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceAllowedEngineSetOverrideCleared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        effectiveAllowed = snapshot.AllowedAliasIds,
                        effectiveDefault = snapshot.DefaultAliasId
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(MapAllowedEngineSet(snapshot));
    }

    /// <summary>Whether workspace admin acknowledged external-subprocessor engine use (TB-2109).</summary>
    [HttpGet("external-subprocessor-engine-acknowledgment")]
    [ProducesResponseType(typeof(ExternalSubprocessorEngineAcknowledgmentResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExternalSubprocessorEngineAcknowledgmentResponse>> GetExternalSubprocessorAcknowledgment(
        CancellationToken cancellationToken)
    {
        bool acknowledged = await _externalSubprocessorEngineAcknowledgmentService
            .HasWorkspaceAcknowledgmentAsync(cancellationToken)
            .ConfigureAwait(false);

        return Ok(new ExternalSubprocessorEngineAcknowledgmentResponse { Acknowledged = acknowledged });
    }

    /// <summary>Record workspace-admin regulated-evidence acknowledgment (TB-2109).</summary>
    [HttpPost("external-subprocessor-engine-acknowledgment")]
    [MutatingAuditExcluded("Audit: ExternalSubprocessorEngineAcknowledgmentService logs WorkspaceExternalSubprocessorEngineAcknowledged via IAuditService.")]
    [ProducesResponseType(typeof(ExternalSubprocessorEngineAcknowledgmentResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExternalSubprocessorEngineAcknowledgmentResponse>> PostExternalSubprocessorAcknowledgment(
        CancellationToken cancellationToken)
    {
        string actor = User?.Identity?.Name ?? "admin";

        await _externalSubprocessorEngineAcknowledgmentService
            .RecordWorkspaceAcknowledgmentAsync(actor, cancellationToken)
            .ConfigureAwait(false);

        return Ok(new ExternalSubprocessorEngineAcknowledgmentResponse { Acknowledged = true });
    }

    /// <summary>Workspace model governance catalog: profile, alias registry, and profile→alias mappings (TB-871).</summary>
    [HttpGet("model-governance-catalog")]
    [ProducesResponseType(typeof(ModelGovernanceCatalogResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ModelGovernanceCatalogResponse>> GetModelGovernanceCatalog(
        CancellationToken cancellationToken)
    {
        WorkspaceModelExecutionProfileSnapshot workspaceSnapshot =
            await _workspaceModelExecutionProfileService.GetAsync(cancellationToken).ConfigureAwait(false);

        ModelGovernanceCatalogBuilder builder = new(_agentModelAliasRegistry);

        ModelGovernanceCatalogResponse catalog = builder.Build(workspaceSnapshot);
        catalog.WorkspaceProfile = await MapModelExecutionProfileAsync(workspaceSnapshot, cancellationToken)
            .ConfigureAwait(false);

        return Ok(catalog);
    }

    private static TenantAgentOutputQualityGateModeResponse Map(TenantAgentOutputQualityGateModeSnapshot snapshot) =>
        new()
        {
            EffectiveMode = snapshot.EffectiveMode.ToString(),
            Source = snapshot.Source.ToString(),
            HostDefaultMode = snapshot.HostDefaultMode.ToString()
        };

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

    private async Task<WorkspaceModelExecutionProfileResponse> MapModelExecutionProfileAsync(
        WorkspaceModelExecutionProfileSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        (DateTime? lastChangedAtUtc, string? lastChangedBy) =
            await TryGetLastProfileChangeAsync(cancellationToken).ConfigureAwait(false);

        return MapModelExecutionProfile(snapshot, lastChangedAtUtc, lastChangedBy);
    }

    private async Task<(DateTime? LastChangedAtUtc, string? LastChangedBy)> TryGetLastProfileChangeAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext? scope = _scopeContextProvider.GetCurrentScope();

        if (scope is null)
        {
            return (null, null);
        }

        AuditEventFilter updatedFilter = new()
        {
            EventType = AuditEventTypes.WorkspaceModelExecutionProfileUpdated,
            Take = 1
        };

        AuditEventFilter clearedFilter = new()
        {
            EventType = AuditEventTypes.WorkspaceModelExecutionProfileOverrideCleared,
            Take = 1
        };

        Task<IReadOnlyList<AuditEvent>> updatedTask = _auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            updatedFilter,
            cancellationToken);

        Task<IReadOnlyList<AuditEvent>> clearedTask = _auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            clearedFilter,
            cancellationToken);

        await Task.WhenAll(updatedTask, clearedTask).ConfigureAwait(false);

        IReadOnlyList<AuditEvent> updatedEvents = updatedTask.Result ?? Array.Empty<AuditEvent>();
        IReadOnlyList<AuditEvent> clearedEvents = clearedTask.Result ?? Array.Empty<AuditEvent>();

        AuditEvent? latest = updatedEvents
            .Concat(clearedEvents)
            .OrderByDescending(static auditEvent => auditEvent.OccurredUtc)
            .FirstOrDefault();

        if (latest is null)
        {
            return (null, null);
        }

        string actor = string.IsNullOrWhiteSpace(latest.ActorUserName)
            ? latest.ActorUserId
            : latest.ActorUserName;

        return (latest.OccurredUtc, actor);
    }

    private static WorkspaceModelExecutionProfileResponse MapModelExecutionProfile(
        WorkspaceModelExecutionProfileSnapshot snapshot,
        DateTime? lastChangedAtUtc = null,
        string? lastChangedBy = null) =>
        new()
        {
            EffectiveProfile = AgentModelExecutionProfileParser.Format(snapshot.EffectiveProfile),
            Source = snapshot.Source.ToString(),
            WorkspaceDefaultProfile = AgentModelExecutionProfileParser.Format(
                WorkspaceModelExecutionProfileService.WorkspaceDefaultProfile),
            LastChangedAtUtc = lastChangedAtUtc,
            LastChangedBy = lastChangedBy
        };

    private static WorkspaceAllowedEngineSetResponse MapAllowedEngineSet(WorkspaceAllowedEngineSetSnapshot snapshot) =>
        new()
        {
            AllowedAliasIds = snapshot.AllowedAliasIds.ToList(),
            DefaultAliasId = snapshot.DefaultAliasId,
            Source = snapshot.Source.ToString()
        };
}
