using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime;

public sealed partial class AgentExecutionTraceForensicPersistence
{
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
