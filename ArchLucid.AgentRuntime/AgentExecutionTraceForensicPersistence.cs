using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Blob + inline SQL persistence for full agent trace prompt/response text with mandatory forensic verification.
/// </summary>
public sealed class AgentExecutionTraceForensicPersistence(
    IAgentExecutionTraceRepository repository,
    IOptions<AgentExecutionTraceStorageOptions> traceStorageOptions,
    IArtifactBlobStore blobStore,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<AgentExecutionTraceForensicPersistence> logger)
    : IAgentExecutionTraceForensicPersistence
{
    private const string BlobContainerName = "agent-traces";

    private const int MinBlobPersistenceTimeoutSeconds = 5;

    private const int MaxBlobPersistenceTimeoutSeconds = 300;

    private static readonly JsonSerializerOptions AuditJsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IArtifactBlobStore _blobStore =
        blobStore ?? throw new ArgumentNullException(nameof(blobStore));

    private readonly ILogger<AgentExecutionTraceForensicPersistence> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IAgentExecutionTraceRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IOptions<AgentExecutionTraceStorageOptions> _traceStorageOptions =
        traceStorageOptions ?? throw new ArgumentNullException(nameof(traceStorageOptions));

    /// <inheritdoc />
    public async Task PersistFullPromptsAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        CancellationToken cancellationToken = default)
    {
        int timeoutSec = Math.Clamp(
            _traceStorageOptions.Value.BlobPersistenceTimeoutSeconds,
            MinBlobPersistenceTimeoutSeconds,
            MaxBlobPersistenceTimeoutSeconds);

        using CancellationTokenSource timeoutCts = new(TimeSpan.FromSeconds(timeoutSec));

        using CancellationTokenSource linked =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        CancellationToken blobCt = linked.Token;

        Stopwatch sw = Stopwatch.StartNew();

        string agentLabel = agentType.ToString();

        TagList agentTags = new() { { "agent_type", agentLabel } };

        bool timedOut = false;

        string? systemKey = null;

        string? userKey = null;

        string? responseKey = null;

        try
        {
            systemKey = await WriteBlobWithRetryAsync(
                BlobContainerName,
                $"{runId}/{traceId}/system-prompt.txt",
                systemPrompt,
                traceId,
                "system_prompt",
                agentType,
                blobCt);

            userKey = await WriteBlobWithRetryAsync(
                BlobContainerName,
                $"{runId}/{traceId}/user-prompt.txt",
                userPrompt,
                traceId,
                "user_prompt",
                agentType,
                blobCt);

            responseKey = await WriteBlobWithRetryAsync(
                BlobContainerName,
                $"{runId}/{traceId}/response.txt",
                rawResponse,
                traceId,
                "response",
                agentType,
                blobCt);
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
                throw;

            timedOut = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Agent trace full prompt persistence failed for TraceId={TraceId}",
                LogSanitizer.Sanitize(traceId));

            List<string> failedOnException = BuildFailedBlobTypes(systemKey, userKey, responseKey);

            await TryLogBlobPersistenceAuditAsync(
                traceId,
                runId,
                agentType,
                "exception",
                failedOnException,
                CancellationToken.None);

            await _repository.PatchBlobStorageFieldsAsync(traceId, systemKey, userKey, responseKey,
                CancellationToken.None);

            await _repository.PatchBlobUploadFailedAsync(traceId, true, CancellationToken.None);

            await ApplyMandatoryInlineAndVerifyAsync(
                traceId,
                runId,
                agentType,
                systemPrompt,
                userPrompt,
                rawResponse,
                systemKey,
                userKey,
                responseKey,
                sw,
                agentTags,
                CancellationToken.None);

            return;
        }

        bool anyFailed = timedOut || systemKey is null || userKey is null || responseKey is null;

        await _repository.PatchBlobStorageFieldsAsync(traceId, systemKey, userKey, responseKey, CancellationToken.None);

        if (anyFailed)
        {
            await _repository.PatchBlobUploadFailedAsync(traceId, true, CancellationToken.None);

            List<string> failed = BuildFailedBlobTypes(systemKey, userKey, responseKey);

            string reason = timedOut ? "timeout" : "upload_failed";

            await TryLogBlobPersistenceAuditAsync(traceId, runId, agentType, reason, failed, CancellationToken.None);

            await ApplyMandatoryInlineAndVerifyAsync(
                traceId,
                runId,
                agentType,
                systemPrompt,
                userPrompt,
                rawResponse,
                systemKey,
                userKey,
                responseKey,
                sw,
                agentTags,
                CancellationToken.None);
        }
        else
        {
            await _repository.PatchBlobUploadFailedAsync(traceId, false, CancellationToken.None);

            await VerifyMandatoryForensicCoverageAsync(
                traceId,
                runId,
                agentType,
                systemPrompt,
                userPrompt,
                rawResponse,
                CancellationToken.None);

            ArchLucidInstrumentation.AgentTraceBlobPersistDurationMs.Record(sw.Elapsed.TotalMilliseconds, agentTags);
        }
    }

    private async Task ApplyMandatoryInlineAndVerifyAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        string? systemKey,
        string? userKey,
        string? responseKey,
        Stopwatch sw,
        TagList agentTags,
        CancellationToken cancellationToken)
    {
        try
        {
            await TryPatchInlineForMissingBlobsAsync(
                traceId,
                systemKey,
                userKey,
                responseKey,
                systemPrompt,
                userPrompt,
                rawResponse,
                agentType,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Agent trace mandatory inline SQL fallback threw for TraceId={TraceId}",
                LogSanitizer.Sanitize(traceId));

            await MarkInlineForensicFailureAsync(
                traceId,
                runId,
                agentType,
                "inline_sql_patch_exception",
                ex.Message,
                cancellationToken);

            ArchLucidInstrumentation.AgentTraceBlobPersistDurationMs.Record(sw.Elapsed.TotalMilliseconds, agentTags);

            return;
        }

        await VerifyMandatoryForensicCoverageAsync(
            traceId,
            runId,
            agentType,
            systemPrompt,
            userPrompt,
            rawResponse,
            cancellationToken);

        ArchLucidInstrumentation.AgentTraceBlobPersistDurationMs.Record(sw.Elapsed.TotalMilliseconds, agentTags);
    }

    private static bool ForensicPartStored(string content, string? blobKey, string? inline)
    {
        return string.IsNullOrEmpty(content)
               || !string.IsNullOrEmpty(blobKey)
               || !string.IsNullOrEmpty(inline);
    }

    private async Task VerifyMandatoryForensicCoverageAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        CancellationToken cancellationToken)
    {
        AgentExecutionTrace? row = await _repository.GetByTraceIdAsync(traceId, cancellationToken);

        if (row is null)
        {
            await MarkInlineForensicFailureAsync(
                traceId,
                runId,
                agentType,
                "trace_row_missing",
                null,
                cancellationToken);

            return;
        }

        if (!ForensicPartStored(systemPrompt, row.FullSystemPromptBlobKey, row.FullSystemPromptInline)
            || !ForensicPartStored(userPrompt, row.FullUserPromptBlobKey, row.FullUserPromptInline)
            || !ForensicPartStored(rawResponse, row.FullResponseBlobKey, row.FullResponseInline))

            await MarkInlineForensicFailureAsync(
                traceId,
                runId,
                agentType,
                "mandatory_full_text_incomplete",
                null,
                cancellationToken);
    }

    private async Task MarkInlineForensicFailureAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string reason,
        string? exceptionDetail,
        CancellationToken cancellationToken)
    {
        await _repository.PatchInlineFallbackFailedAsync(traceId, true, cancellationToken);

        await TryLogInlineFallbackFailedAuditAsync(
            traceId,
            runId,
            agentType,
            reason,
            exceptionDetail,
            cancellationToken);
    }

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

    private Task TryPatchInlineForMissingBlobsAsync(
        string traceId,
        string? systemKey,
        string? userKey,
        string? responseKey,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        string? systemInline = systemKey is null ? systemPrompt : null;

        string? userInline = userKey is null ? userPrompt : null;

        string? responseInline = responseKey is null ? rawResponse : null;

        if (systemInline is not null)

            RecordPromptInlineFallback(agentType, "system_prompt");

        if (userInline is not null)

            RecordPromptInlineFallback(agentType, "user_prompt");

        if (responseInline is not null)

            RecordPromptInlineFallback(agentType, "response");

        if (systemInline is null && userInline is null && responseInline is null)
            return Task.CompletedTask;

        return _repository.PatchInlinePromptFallbackAsync(
            traceId,
            systemInline,
            userInline,
            responseInline,
            cancellationToken);
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

    private static List<string> BuildFailedBlobTypes(string? systemKey, string? userKey, string? responseKey)
    {
        List<string> failed = [];

        if (systemKey is null)

            failed.Add("system_prompt");

        if (userKey is null)

            failed.Add("user_prompt");

        if (responseKey is null)

            failed.Add("response");

        return failed;
    }
}
