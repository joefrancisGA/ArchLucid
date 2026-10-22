using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Durable audit helpers for operator finding instrumentation (thumbs feedback and ask conversation persistence).
/// </summary>
public sealed class FindingInstrumentationAuditSupport(
    IAuditService auditService,
    ILogger<FindingInstrumentationAuditSupport> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<FindingInstrumentationAuditSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task LogFeedbackRecordedAsync(
        ScopeContext scope,
        string actor,
        Guid runId,
        string findingId,
        short score,
        FindingClassification? classification,
        string? comment,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);

        string dataJson = JsonSerializer.Serialize(
            BuildFeedbackAuditPayload(findingId, score, classification, comment),
            AuditJsonSerializationOptions.Instance);

        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.FindingFeedbackRecorded,
            actor,
            actor,
            dataJson);
        auditEvent.RunId = runId;

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"FindingFeedbackRecorded:{LogSanitizer.Sanitize(findingId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.FindingFeedbackRecorded);
    }

    public async Task LogAskConversationPersistedAsync(
        ScopeContext scope,
        string actor,
        string findingId,
        Guid? runId,
        Guid threadId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);

        string dataJson = JsonSerializer.Serialize(
            new
            {
                findingId,
                threadId,
                action = "conversationPersisted",
            },
            AuditJsonSerializationOptions.Instance);

        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.FindingAskConversationPersisted,
            actor,
            actor,
            dataJson);
        auditEvent.RunId = runId;

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"FindingAskConversationPersisted:{LogSanitizer.Sanitize(findingId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.FindingAskConversationPersisted);
    }

    /// <summary>
    ///     Decision-grade findings omit free-text feedback comments from durable audit payloads (DR-09).
    /// </summary>
    public static object BuildFeedbackAuditPayload(
        string findingId,
        short score,
        FindingClassification? classification,
        string? comment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);

        bool omitComment = DecisionGradeFindingExportFilter.IsDecisionGradeForExport(classification);
        bool hasComment = !string.IsNullOrWhiteSpace(comment);

        if (!hasComment || !omitComment)
        {
            if (!hasComment)
            {
                return new { findingId, score };
            }

            return new { findingId, score, comment = comment!.Trim() };
        }

        return new { findingId, score, commentOmitted = true };
    }
}
