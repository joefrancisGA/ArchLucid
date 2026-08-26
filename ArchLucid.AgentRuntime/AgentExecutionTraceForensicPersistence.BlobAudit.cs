using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

public sealed partial class AgentExecutionTraceForensicPersistence
{
    private async Task TryLogInlineFallbackFailedAuditAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string reason,
        string? exceptionDetail,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;

            string dataJson = JsonSerializer.Serialize(
                new
                {
                    traceId,
                    runId,
                    agentType = agentType.ToString(),
                    reason,
                    exceptionDetail
                },
                AuditJsonOptions);

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.AgentTraceInlineFallbackFailed,
                "agent-runtime",
                "agent-runtime",
                dataJson);
            auditEvent.RunId = runGuid;

            await _auditService.LogAsync(auditEvent, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Durable audit for AgentTraceInlineFallbackFailed failed for TraceId={TraceId}",
                LogSanitizer.Sanitize(traceId));
        }
    }

    private static void RecordPromptInlineFallback(AgentType agentType, string blobType)
    {
        TagList tags = new() { { "agent_type", agentType.ToString() }, { "blob_type", blobType } };

        ArchLucidInstrumentation.AgentTracePromptInlineFallbacksTotal.Add(1, tags);
    }

    private async Task TryLogBlobPersistenceAuditAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string reason,
        IReadOnlyList<string> failedBlobTypes,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;

            string dataJson = JsonSerializer.Serialize(
                new
                {
                    traceId,
                    runId,
                    agentType = agentType.ToString(),
                    reason,
                    failedBlobTypes
                },
                AuditJsonOptions);

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.AgentTraceBlobPersistenceFailed,
                "agent-runtime",
                "agent-runtime",
                dataJson);
            auditEvent.RunId = runGuid;

            await _auditService.LogAsync(auditEvent, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Durable audit for AgentTraceBlobPersistenceFailed failed for TraceId={TraceId}",
                LogSanitizer.Sanitize(traceId));
        }
    }

    private async Task<string?> WriteBlobWithRetryAsync(
        string containerName,
        string blobPath,
        string content,
        string traceId,
        string blobType,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        const int maxAttempts = 3;

        // Fixed backoff between attempts (Prompt 2 / quality spec): 2 retries after the first try, 500 ms apart.
        const int retryDelayMs = 500;

        string agentLabel = agentType.ToString();

        TagList tags = new() { { "agent_type", agentLabel }, { "blob_type", blobType } };

        for (int attempt = 1; attempt <= maxAttempts; attempt++)

            try
            {
                return await _blobStore.WriteAsync(containerName, blobPath, content, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Agent trace {BlobType} blob write attempt {Attempt}/{MaxAttempts} failed for TraceId={TraceId}",
                    LogSanitizer.Sanitize(blobType),
                    attempt,
                    maxAttempts,
                    LogSanitizer.Sanitize(traceId));

                if (attempt < maxAttempts)

                    await Task.Delay(retryDelayMs, cancellationToken);
            }

        ArchLucidInstrumentation.AgentTraceBlobUploadFailuresTotal.Add(1, tags);

        return null;
    }
}
