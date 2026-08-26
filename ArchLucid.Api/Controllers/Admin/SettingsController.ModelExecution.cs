using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class SettingsController
{
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
}
