using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Replay.Historical.Retention;

/// <summary>Uses the existing scoped append-only audit journal. Backup readers must never implement this authority.</summary>
public sealed class HistoricalErasureJournal(IAuditRepository repository, IScopeContextProvider scopes,
    TimeProvider clock, ILogger<HistoricalErasureJournal> logger)
{
    private readonly IAuditRepository audit = repository ?? throw new ArgumentNullException(nameof(repository));
    private readonly TimeProvider time = clock ?? throw new ArgumentNullException(nameof(clock));

    public async ValueTask<bool?> IsErasedAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var scope = identity.Run.Scope;
        RequireCurrentScope(scope);
        return await audit.HasCommittedEventAsync(scope, AuditEventTypes.HistoricalReplayArtifactErased,
            Key(identity), cancellationToken);
    }

    /// <summary>Append after an existing authorized erasure owner confirms completion and policy permits this minimum marker.</summary>
    public Task RecordCompletedErasureAsync(HistoricalArtifactIdentity identity, Guid completedErasureReceiptId,
        string authorizedActorId, CancellationToken cancellationToken)
    {
        if (completedErasureReceiptId == Guid.Empty || !HistoricalRetentionPolicyRules.Token(authorizedActorId))
            throw new ArgumentException("Completed erasure receipt and authorized actor are required.");
        var scope = identity.Run.Scope;
        RequireCurrentScope(scope);
        var marker = new AuditEvent
        {
            EventType = AuditEventTypes.HistoricalReplayArtifactErased,
            OccurredUtc = time.GetUtcNow().UtcDateTime,
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
            CorrelationId = Key(identity),
            ActorUserId = authorizedActorId, ActorUserName = authorizedActorId, ExplicitActor = true,
            DataJson = JsonSerializer.Serialize(new { completedErasureReceiptId }),
        };
        return DurableAuditLogRetry.LogOrThrowAsync(ct => audit.AppendAsync(marker, ct), logger,
            "historical replay erasure marker", cancellationToken, maxAttempts: 1,
            auditEventTypeForMetrics: AuditEventTypes.HistoricalReplayArtifactErased);
    }

    private void RequireCurrentScope(ProjectScopeKey scope)
    {
        var ambient = scopes.GetCurrentScope();
        if (!scope.Matches(ambient.TenantId, ambient.WorkspaceId, ambient.ProjectId))
            throw new UnauthorizedAccessException("The current runtime scope does not authorize this historical erasure journal.");
    }

    internal static string Key(HistoricalArtifactIdentity identity) => AnalysisDependencyFingerprint.Digest(new
    {
        Kind = "historical-erasure-v1", identity.Run.Scope, identity.Run.Product, identity.ArtifactId,
    });
}
