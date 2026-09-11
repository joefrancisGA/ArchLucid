using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Finalization;

/// <inheritdoc cref="IRunAssumptionAcknowledgementService" />
public sealed class RunAssumptionAcknowledgementService(
    IRunRepository runRepository,
    IActorContext actorContext,
    IAuditService auditService) : IRunAssumptionAcknowledgementService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<RunAssumptionAcknowledgementDocument> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord header = await RequireRunAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        return RunAssumptionAcknowledgementJson.TryDeserialize(header.AcknowledgedAssumptionsJson)
            ?? new RunAssumptionAcknowledgementDocument { AcknowledgedUtc = DateTime.MinValue };
    }

    /// <inheritdoc />
    public async Task<IReadOnlySet<string>> GetAcknowledgedIdsAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        return RunAssumptionAcknowledgementJson.ReadAcknowledgedIds(header?.AcknowledgedAssumptionsJson);
    }

    /// <inheritdoc />
    public async Task<RunAssumptionAcknowledgementDocument> PutAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyCollection<string> acknowledgedAssumptionIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(acknowledgedAssumptionIds);

        RunRecord header = await RequireRunAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        // Sealed packages are immutable evidence; acknowledging after seal would rewrite what the gate saw.
        if (header.GoldenManifestId is not null)
            throw new ConflictException("Assumption acknowledgements cannot change after the review is finalized.");

        RunAssumptionAcknowledgementDocument document = new()
        {
            ActorUserId = _actorContext.GetActor(),
            AcknowledgedUtc = TimeProvider.System.UtcNowDateTime(),
            AcknowledgedAssumptionIds = RunAssumptionAcknowledgementJson
                .NormalizeIds(acknowledgedAssumptionIds)
                .Order(StringComparer.Ordinal)
                .ToList(),
        };

        header.AcknowledgedAssumptionsJson = RunAssumptionAcknowledgementJson.Serialize(document);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);
        await TryAuditAsync(scope, runId, document, cancellationToken).ConfigureAwait(false);

        return document;
    }

    private async Task<RunRecord> RequireRunAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (header is null)
            throw new RunNotFoundException(runId.ToString("N"));

        return header;
    }

    private async Task TryAuditAsync(
        ScopeContext scope,
        Guid runId,
        RunAssumptionAcknowledgementDocument document,
        CancellationToken cancellationToken)
    {
        try
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunAssumptionsAcknowledged,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = runId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        runId = runId.ToString("N"),
                        acknowledgedCount = document.AcknowledgedAssumptionIds.Count,
                    }),
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Audit failure must not block acknowledgement persistence (same posture as coverage acknowledgement).
        }
    }
}
