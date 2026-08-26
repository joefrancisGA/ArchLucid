using System.Diagnostics;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

public sealed partial class AgentExecutionTraceForensicPersistence
{
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
}
