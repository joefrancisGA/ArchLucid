using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Drafts;

/// <summary>LW-015: Required durable audit when Keep mine wins a draft PATCH.</summary>
public sealed class DraftForceOverwriteAuditSupport(
    IAuditService auditService,
    IActorContext actorContext,
    ILogger<DraftForceOverwriteAuditSupport> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ILogger<DraftForceOverwriteAuditSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task LogForceOverwriteAsync(
        ScopeContext scope,
        Guid draftId,
        DateTime previousUpdatedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string actor = _actorContext.GetActor();
        string actorId = _actorContext.GetActorId();

        if (string.IsNullOrWhiteSpace(actor))
            throw new InvalidOperationException("Keep mine audit requires an actor display name.");

        if (string.IsNullOrWhiteSpace(actorId))
            throw new InvalidOperationException("Keep mine audit requires an actor id.");

        object payload = new
        {
            draftId,
            previousUpdatedUtc = DateTime.SpecifyKind(previousUpdatedUtc, DateTimeKind.Utc).ToString("O"),
        };

        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.DraftIntakeForceOverwriteApplied,
            actorId,
            actor,
            JsonSerializer.Serialize(payload));

        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"DraftIntakeForceOverwriteApplied:{draftId:N}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.DraftIntakeForceOverwriteApplied);
    }
}
