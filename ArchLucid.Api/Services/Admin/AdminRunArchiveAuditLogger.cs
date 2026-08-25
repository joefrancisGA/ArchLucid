using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Services.Admin;

public interface IAdminRunArchiveAuditLogger
{
    Task LogManifestArchivedBatchAsync(
        string kind,
        int updatedCount,
        List<string> archivedRunIdsSample,
        RunArchiveChildCascadeCounts childCascade,
        CancellationToken cancellationToken);
}

public sealed class AdminRunArchiveAuditLogger(IActorContext actorContext, IAuditService auditService)
    : IAdminRunArchiveAuditLogger
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task LogManifestArchivedBatchAsync(
        string kind,
        int updatedCount,
        List<string> archivedRunIdsSample,
        RunArchiveChildCascadeCounts childCascade,
        CancellationToken cancellationToken)
    {
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ManifestArchived,
                ActorUserId = actor,
                ActorUserName = actor,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        kind,
                        updatedRuns = updatedCount,
                        sampleRunIds = archivedRunIdsSample.Take(64).ToList(),
                        childCascade
                    })
            },
            cancellationToken);
    }
}
