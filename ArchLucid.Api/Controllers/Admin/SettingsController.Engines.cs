using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class SettingsController
{
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

    private static WorkspaceAllowedEngineSetResponse MapAllowedEngineSet(WorkspaceAllowedEngineSetSnapshot snapshot) =>
        new()
        {
            AllowedAliasIds = snapshot.AllowedAliasIds.ToList(),
            DefaultAliasId = snapshot.DefaultAliasId,
            Source = snapshot.Source.ToString()
        };
}
