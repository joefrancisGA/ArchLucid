using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using ArchLucid.Retrieval.Chunking;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>
/// <see cref="IAskService"/> implementation: conversation thread + structured JSON context + optional retrieval + LLM JSON answer shape.
/// </summary>
/// <remarks>
/// Retrieval and post-answer indexing failures are logged and do not fail the request. LLM failures return a short fallback <see cref="AskResponse"/>.
/// </remarks>
public sealed class AskService(
    IAuthorityQueryService query,
    IProvenanceQueryService provenanceQuery,
    IComparisonService comparison,
    IAgentCompletionClient llm,
    IConversationService conversationService,
    IFindingInspectReadRepository findingInspectReadRepository,
    IRetrievalQueryService retrievalQuery,
    IRetrievalDocumentBuilder retrievalDocumentBuilder,
    IRetrievalIndexingService retrievalIndexingService,
    ILogger<AskService> logger) : IAskService
{
    private const int HistoryTake = 40;

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true, ReadCommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true
    };

    private const string ArchitectSystemPrompt =
        "You are a senior enterprise architect. " +
        "Use ONLY the provided architecture context JSON, conversation history, and retrieved evidence. " +
        "Be precise and technical. Reference decisions by Title and SelectedOption (and DecisionId when helpful). " +
        "Do not invent services, findings, artifacts, or costs not present in the supplied materials. " +
        "If something is unknown from the supplied data, say so. " +
        "Prefer retrieved evidence when answering specifics that are not in the structured context. " +
        "Use prior conversation only when it helps interpret follow-up questions (e.g. \"that decision\", \"the storage choice\"). " +
        "When the answer is more than a brief sentence, structure the answer field as plain text: use section headers " +
        "Risk:, Evidence:, Mitigation:, and Validation: each on its own line; after each header add a blank line, then " +
        "the section body. Omit any header whose body would be empty. " +
        "Respond with a single JSON object only (no markdown fences), keys: " +
        "answer (string), referencedDecisions (array of strings), referencedFindings (array of strings), " +
        "referencedArtifacts (array of strings; use provenance graph node labels where Type suggests an artifact, or empty array).";

    private const string FindingArchitectSystemPrompt =
        "You are an enterprise architect. Explain this specific architecture finding clearly: " +
        "why it matters, what evidence supports it, and what the smallest concrete fix is. " +
        "Use only the supplied finding data and conversation history. " +
        "Respond with a single JSON object only (no markdown fences), keys: " +
        "answer (string), referencedDecisions (array of strings), referencedFindings (array of strings), referencedArtifacts (array of strings).";

    /// <inheritdoc />
    public async Task<AskResponse> AskAsync(AskRequest request, ScopeContext scope, CancellationToken ct)
    {
        AskPreparedContext prepared = await PrepareAskContextAsync(request, scope, ct);
        string? comparisonNarrative = await TryBuildComparisonNarrativeAsync(prepared, ct);
        string userPrompt = BuildUserPrompt(prepared);

        string? raw;
        try
        {
            raw = await llm.CompleteJsonAsync(
                ArchitectSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "LLM completion failed for Ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            AskResponse fallback = await PersistFallbackResponseAsync(prepared, ct);
            fallback.ComparisonNarrative = comparisonNarrative;
            return fallback;
        }

        AskResponse response = await FinalizeAskResponseAsync(prepared, raw, ct);
        response.ComparisonNarrative = comparisonNarrative;
        return response;
    }

    /// <inheritdoc />
    public async Task<AskResponse> AskStreamAsync(
        AskRequest request,
        ScopeContext scope,
        Func<string, CancellationToken, Task> onAnswerTokenAsync,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(onAnswerTokenAsync);

        AskPreparedContext prepared = await PrepareAskContextAsync(request, scope, ct);
        string userPrompt = BuildUserPrompt(prepared);
        StreamingJsonAnswerExtractor extractor = new();

        string? raw;
        try
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               llm,
                               ArchitectSystemPrompt,
                               userPrompt,
                               maxTokens: null,
                               cancellationToken: ct).ConfigureAwait(false))
            {
                string delta = extractor.AppendChunkAndTakeAnswerDelta(chunk);

                if (delta.Length > 0)
                    await onAnswerTokenAsync(delta, ct).ConfigureAwait(false);
            }

            raw = extractor.RawJson;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "LLM streaming failed for Ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            return await PersistFallbackResponseAsync(prepared, ct);
        }

        return await FinalizeAskResponseAsync(prepared, raw, ct);
    }

    /// <inheritdoc />
    public async Task<AskResponse> AskAboutFindingAsync(FindingAskRequest request, ScopeContext scope, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);


        if (request.FindingId == Guid.Empty)
            throw new ArgumentException("FindingId is required.", nameof(request));


        if (string.IsNullOrWhiteSpace(request.Question))
            throw new ArgumentException("Question is required.", nameof(request));

        string findingId = request.FindingId.ToString("N");
        ConversationThread thread = await conversationService.GetOrCreateThreadAsync(
            request.ThreadId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId: null,
            baseRunId: null,
            targetRunId: null,
            ct);

        string question = request.Question.Trim();
        await conversationService.AppendUserMessageAsync(thread.ThreadId, question, ct);

        IReadOnlyList<ConversationMessage> historyWindow = await conversationService.GetHistoryAsync(thread.ThreadId, HistoryTake, ct);
        IReadOnlyList<ConversationMessage> priorMessages = TrimCurrentUserTurn(historyWindow, question);
        string historyText = BuildConversationHistory(priorMessages);

        Contracts.Findings.FindingInspectResponse? finding = await findingInspectReadRepository.GetInspectAsync(scope, findingId, ct);

        if (finding is null)
            throw new InvalidOperationException($"Finding '{findingId}' was not found in the current scope.");

        object findingContext = new
        {
            findingId = finding.FindingId,
            severity = finding.Severity.ToString(),
            typedPayload = finding.TypedPayload,
            evidenceRefs = finding.Evidence.Select(e => e.Excerpt).Where(static e => !string.IsNullOrWhiteSpace(e)).ToArray(),
            recommendedActions = finding.RecommendedActions,
            reasoningSummary = finding.ReasoningSummary
        };

        string contextJson = JsonSerializer.Serialize(findingContext, ContractJson.CamelCaseIgnoreNullCompact);
        string userPrompt =
            "Conversation History:\n" +
            (string.IsNullOrWhiteSpace(historyText) ? "(none)\n" : historyText + "\n") +
            "\nFinding Context:\n" +
            contextJson +
            "\n\nUser Question:\n" +
            question;

        string? raw;
        try
        {
            raw = await llm.CompleteJsonAsync(
                FindingArchitectSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "LLM completion failed for finding ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(thread.ThreadId.ToString()));
            return await PersistFindingFallbackResponseAsync(thread.ThreadId, question, ct);
        }

        AskResponse response = ParseAskResponse(thread.ThreadId, raw);
        await PersistFindingAssistantTurnAsync(thread.ThreadId, question, response, ct);
        return response;
    }

    private async Task<AskPreparedContext> PrepareAskContextAsync(
        AskRequest request,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Question))
            throw new ArgumentException("Question is required.", nameof(request));

        ConversationThread thread = await conversationService.GetOrCreateThreadAsync(
            request.ThreadId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            request.RunId,
            request.BaseRunId,
            request.TargetRunId,
            ct);

        Guid? effectiveRunId = request.RunId ?? thread.RunId;
        Guid? effectiveBaseRunId = request.BaseRunId ?? thread.BaseRunId;
        Guid? effectiveTargetRunId = request.TargetRunId ?? thread.TargetRunId;

        if (!effectiveRunId.HasValue)

            throw new InvalidOperationException(
                "No run is anchored. Provide runId on the first message, or use a thread that already has a run.");

        string question = request.Question.Trim();
        await conversationService.AppendUserMessageAsync(thread.ThreadId, question, ct);

        IReadOnlyList<ConversationMessage> historyWindow = await conversationService.GetHistoryAsync(thread.ThreadId, HistoryTake, ct);
        IReadOnlyList<ConversationMessage> priorMessages = TrimCurrentUserTurn(historyWindow, question);
        string historyText = BuildConversationHistory(priorMessages);

        RunDetailDto? detail = await query.GetRunDetailAsync(scope, effectiveRunId.Value, ct);
        if (detail?.GoldenManifest is null)

            throw new InvalidOperationException(
                "Run not found or has no ManifestDocument for the current scope.");

        ManifestDocument manifest = detail.GoldenManifest;
        GraphViewModel? graph = await provenanceQuery.GetFullGraphAsync(scope, effectiveRunId.Value, ct);

        ComparisonResult? comparisonResult = null;
        if (effectiveBaseRunId.HasValue && effectiveTargetRunId.HasValue)
        {
            RunDetailDto? baseRun = await query.GetRunDetailAsync(scope, effectiveBaseRunId.Value, ct);
            RunDetailDto? targetRun = await query.GetRunDetailAsync(scope, effectiveTargetRunId.Value, ct);
            if (baseRun?.GoldenManifest is not null && targetRun?.GoldenManifest is not null)
                comparisonResult = comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
        }

        object context = ContextBuilder.BuildContext(manifest, graph, comparisonResult);
        string contextJson = JsonSerializer.Serialize(context, ContractJson.CamelCaseIgnoreNullCompact);
        contextJson = TokenAwareContextBudget.TruncateToTokenBudget(contextJson, out bool contextTruncated);

        if (contextTruncated)
        {
            logger.LogWarning(
                "Ask structured context truncated for token budget (ThreadId={ThreadId}, RunId={RunId}).",
                LogSanitizer.Sanitize(thread.ThreadId.ToString()),
                LogSanitizer.Sanitize(effectiveRunId.Value.ToString()));
        }

        IReadOnlyList<RetrievalHit> retrievalHits = [];
        try
        {
            retrievalHits = await retrievalQuery.SearchAsync(
                new RetrievalQuery
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = null,
                    ManifestId = null,
                    QueryText = question,
                    TopK = 8
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Retrieval search failed for Ask; continuing without retrieved evidence.");
        }

        return new AskPreparedContext(
            thread,
            question,
            historyText,
            manifest,
            effectiveRunId,
            effectiveBaseRunId,
            effectiveTargetRunId,
            comparisonResult,
            contextJson,
            BuildRetrievalContext(retrievalHits),
            scope);
    }

    private const string ComparisonNarrativeSystemPrompt =
        "You are an enterprise architect. Given the delta between two architecture runs, write a 3–5 sentence narrative: "
        + "(1) the most significant improvement, (2) any new risk introduced, (3) whether the architecture is net-better or net-worse. "
        + "Return ONLY the narrative prose.";

    private async Task<string?> TryBuildComparisonNarrativeAsync(AskPreparedContext prepared, CancellationToken ct)
    {
        if (!prepared.BaseRunId.HasValue || !prepared.TargetRunId.HasValue || prepared.ComparisonResult is null)
            return null;

        string userPrompt =
            "Structured comparison delta JSON:\n" +
            JsonSerializer.Serialize(prepared.ComparisonResult, ContractJson.CamelCaseIgnoreNullCompact);

        try
        {
            string narrative = await llm.CompleteJsonAsync(
                ComparisonNarrativeSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: ct);

            return string.IsNullOrWhiteSpace(narrative) ? null : narrative.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Comparison narrative generation failed (ThreadId={ThreadId}).",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            return null;
        }
    }

    private static string BuildUserPrompt(AskPreparedContext prepared) =>
        "Conversation History:\n" +
        (string.IsNullOrWhiteSpace(prepared.HistoryText) ? "(none)\n" : prepared.HistoryText + "\n") +
        "\nStructured Context:\n" +
        prepared.ContextJson +
        "\n\nRetrieved Evidence:\n" +
        (string.IsNullOrWhiteSpace(prepared.RetrievalContext) ? "(none)\n" : prepared.RetrievalContext + "\n") +
        "\nUser Question:\n" +
        prepared.Question;

    private async Task<AskResponse> PersistFallbackResponseAsync(AskPreparedContext prepared, CancellationToken ct)
    {
        AskResponse response = new()
        {
            ThreadId = prepared.Thread.ThreadId,
            Answer =
                "The assistant could not be reached. Summarize from context manually or retry. " +
                "Context included " + prepared.Manifest.Decisions.Count + " decision(s)."
        };

        await PersistAssistantTurnAsync(prepared, response, ct);

        return response;
    }

    private async Task<AskResponse> FinalizeAskResponseAsync(AskPreparedContext prepared, string? raw, CancellationToken ct)
    {
        AskResponse response = ParseAskResponse(prepared.Thread.ThreadId, raw);

        await PersistAssistantTurnAsync(prepared, response, ct);

        return response;
    }

    private async Task<AskResponse> PersistFindingFallbackResponseAsync(Guid threadId, string question, CancellationToken ct)
    {
        AskResponse response = new()
        {
            ThreadId = threadId,
            Answer = "The assistant could not be reached. Review the finding details and retry."
        };

        await PersistFindingAssistantTurnAsync(threadId, question, response, ct);
        return response;
    }

    private async Task PersistFindingAssistantTurnAsync(Guid threadId, string question, AskResponse response, CancellationToken ct)
    {
        string metadataJson = JsonSerializer.Serialize(
            new { response.ReferencedDecisions, response.ReferencedFindings, response.ReferencedArtifacts },
            ContractJson.CamelCaseCompact);

        await conversationService.AppendAssistantMessageAsync(
            threadId,
            response.Answer,
            metadataJson,
            ct);

        try
        {
            DateTime now = TimeProvider.System.UtcNowDateTime();
            List<ConversationMessage> conversationTurn =
            [
                new()
                {
                    MessageId = Guid.NewGuid(),
                    ThreadId = threadId,
                    Role = ConversationMessageRole.User,
                    Content = question,
                    CreatedUtc = now,
                    MetadataJson = "{}"
                },

                new()
                {
                    MessageId = Guid.NewGuid(),
                    ThreadId = threadId,
                    Role = ConversationMessageRole.Assistant,
                    Content = response.Answer,
                    CreatedUtc = now,
                    MetadataJson = metadataJson
                }
            ];

            IReadOnlyList<RetrievalDocument> convDocs = retrievalDocumentBuilder.BuildForConversation(
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                null,
                conversationTurn);

            await retrievalIndexingService.IndexDocumentsAsync(convDocs, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to index finding-ask conversation turn for retrieval.");
        }
    }

    private AskResponse ParseAskResponse(Guid threadId, string? raw)
    {
        string? unwrapped = UnwrapJsonFence(raw);
        LlmAskShape? parsed = TryDeserialize(unwrapped);

        if (parsed is null || string.IsNullOrWhiteSpace(parsed.Answer))
        {
            return new AskResponse
            {
                ThreadId = threadId,
                Answer = string.IsNullOrWhiteSpace(unwrapped)
                    ? "No answer produced."
                    : unwrapped.Trim(),
                ReferencedDecisions = [],
                ReferencedFindings = [],
                ReferencedArtifacts = []
            };
        }

        return new AskResponse
        {
            ThreadId = threadId,
            Answer = parsed.Answer.Trim(),
            ReferencedDecisions = NormalizeList(parsed.ReferencedDecisions),
            ReferencedFindings = NormalizeList(parsed.ReferencedFindings),
            ReferencedArtifacts = NormalizeList(parsed.ReferencedArtifacts)
        };
    }

    private async Task PersistAssistantTurnAsync(AskPreparedContext prepared, AskResponse response, CancellationToken ct)
    {
        string metadataJson = JsonSerializer.Serialize(
            new { response.ReferencedDecisions, response.ReferencedFindings, response.ReferencedArtifacts },
            ContractJson.CamelCaseCompact);

        await conversationService.AppendAssistantMessageAsync(
            prepared.Thread.ThreadId,
            response.Answer,
            metadataJson,
            ct);

        try
        {
            DateTime now = TimeProvider.System.UtcNowDateTime();
            List<ConversationMessage> conversationTurn =
            [
                new()
                {
                    MessageId = Guid.NewGuid(),
                    ThreadId = prepared.Thread.ThreadId,
                    Role = ConversationMessageRole.User,
                    Content = prepared.Question,
                    CreatedUtc = now,
                    MetadataJson = "{}"
                },

                new()
                {
                    MessageId = Guid.NewGuid(),
                    ThreadId = prepared.Thread.ThreadId,
                    Role = ConversationMessageRole.Assistant,
                    Content = response.Answer,
                    CreatedUtc = now,
                    MetadataJson = metadataJson
                }
            ];

            IReadOnlyList<RetrievalDocument> convDocs = retrievalDocumentBuilder.BuildForConversation(
                prepared.Scope.TenantId,
                prepared.Scope.WorkspaceId,
                prepared.Scope.ProjectId,
                prepared.EffectiveRunId,
                conversationTurn);

            await retrievalIndexingService.IndexDocumentsAsync(convDocs, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to index Ask conversation turn for retrieval.");
        }
    }

    private sealed record AskPreparedContext(
        ConversationThread Thread,
        string Question,
        string HistoryText,
        ManifestDocument Manifest,
        Guid? EffectiveRunId,
        Guid? BaseRunId,
        Guid? TargetRunId,
        ComparisonResult? ComparisonResult,
        string ContextJson,
        string RetrievalContext,
        ScopeContext Scope);

    private static string BuildRetrievalContext(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count == 0)
            return string.Empty;

        return string.Join(
            Environment.NewLine + Environment.NewLine,
            hits.Select((h, i) =>
                $"[{i + 1}] {h.SourceType} / {h.Title}{Environment.NewLine}{h.Text}"));
    }

    /// <summary>Exclude the just-appended user message from the history block (it is repeated as User Question).</summary>
    private static IReadOnlyList<ConversationMessage> TrimCurrentUserTurn(
        IReadOnlyList<ConversationMessage> messages,
        string question)
    {
        if (messages.Count == 0)
            return messages;

        ConversationMessage last = messages[^1];
        if (last.Role == ConversationMessageRole.User &&
            string.Equals(last.Content.Trim(), question, StringComparison.Ordinal))
            return messages.Take(messages.Count - 1).ToList();

        return messages;
    }

    private static string BuildConversationHistory(IReadOnlyList<ConversationMessage> messages)
    {
        if (messages.Count == 0)
            return string.Empty;

        return string.Join(
            Environment.NewLine,
            messages.Select(m => $"{m.Role}: {m.Content}"));
    }

    private static List<string> NormalizeList(IEnumerable<string>? items) =>
        items?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? [];

    private static string? UnwrapJsonFence(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return raw;
        string s = raw.Trim();
        if (!s.StartsWith("```", StringComparison.Ordinal))
            return s;
        int firstNl = s.IndexOf('\n');
        if (firstNl > 0)
            s = s[(firstNl + 1)..].Trim();
        int end = s.LastIndexOf("```", StringComparison.Ordinal);
        if (end > 0)
            s = s[..end].Trim();
        return s;
    }

    private LlmAskShape? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        try
        {
            return JsonSerializer.Deserialize<LlmAskShape>(json, JsonRead);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Failed to deserialize LLM Ask response as JSON; falling back to raw text.");
            return null;
        }
    }

    private sealed class LlmAskShape
    {
        public string? Answer
        {
            get;
            init;
        }

        public List<string>? ReferencedDecisions
        {
            get;
            init;
        }

        public List<string>? ReferencedFindings
        {
            get;
            init;
        }

        public List<string>? ReferencedArtifacts
        {
            get;
            init;
        }
    }
}
