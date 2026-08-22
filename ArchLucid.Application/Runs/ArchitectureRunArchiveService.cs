using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Runs;

/// <inheritdoc />
public sealed class ArchitectureRunArchiveService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IActorContext actorContext) : IArchitectureRunArchiveService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    /// <inheritdoc />
    public async Task<ArchitectureRunArchiveOutcome> TryArchiveAsync(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return ArchitectureRunArchiveOutcome.NotFound;

        if (run.ArchivedUtc is not null)
            return ArchitectureRunArchiveOutcome.AlreadyArchived;

        if (run.GoldenManifestId is not null)
            return ArchitectureRunArchiveOutcome.SealedReviewBlocked;

        RunArchiveByIdsResult batch = await _runRepository
            .ArchiveRunsByIdsAsync([runId], cancellationToken)
            .ConfigureAwait(false);

        if (batch.SucceededRunIds.Count == 0)
            return ArchitectureRunArchiveOutcome.NotFound;

        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureReviewArchived,
                ActorUserId = _actorContext.GetActorId(),
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { runId = runId.ToString("D") },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken).ConfigureAwait(false);

        return ArchitectureRunArchiveOutcome.Archived;
    }
}
