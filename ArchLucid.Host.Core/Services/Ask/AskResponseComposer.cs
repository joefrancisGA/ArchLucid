using System.Text.Json;

using ArchLucid.Application.Ask;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Parses LLM Ask JSON, persists conversation turns, and indexes retrieval documents.</summary>
public sealed class AskResponseComposer(
    IConversationService conversationService,
    IRetrievalDocumentBuilder retrievalDocumentBuilder,
    IRetrievalIndexingService retrievalIndexingService,
    ILogger<AskResponseComposer> logger)
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    private readonly IConversationService _conversationService =
        conversationService ?? throw new ArgumentNullException(nameof(conversationService));

    private readonly IRetrievalDocumentBuilder _retrievalDocumentBuilder =
        retrievalDocumentBuilder ?? throw new ArgumentNullException(nameof(retrievalDocumentBuilder));

    private readonly IRetrievalIndexingService _retrievalIndexingService =
        retrievalIndexingService ?? throw new ArgumentNullException(nameof(retrievalIndexingService));

    private readonly ILogger<AskResponseComposer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AskResponse BuildFallbackResponse(AskPreparedContext prepared)
    {
        return new AskResponse
        {
            ThreadId = prepared.Thread.ThreadId,
            Answer =
                "The assistant could not be reached. Summarize from context manually or retry. " +
                (prepared.Manifest is { Decisions: { Count: var decisionCount } }
                    ? $"Context included {decisionCount} decision(s)."
                    : "Workspace-scoped context relies on retrieved evidence across reviews."),
            RetrievalDegraded = prepared.RetrievalDegraded,
        };
    }

    public AskResponse BuildFindingFallbackResponse(Guid threadId) =>
        new()
        {
            ThreadId = threadId,
            Answer = "The assistant could not be reached. Review the finding details and retry."
        };

    public async Task<AskResponse> FinalizeAsync(
        AskPreparedContext prepared,
        string? raw,
        CancellationToken cancellationToken)
    {
        AskResponse response = Parse(prepared.Thread.ThreadId, raw);
        response.RetrievalDegraded = prepared.RetrievalDegraded;

        await PersistRunScopedTurnAsync(prepared, response, cancellationToken);

        return response;
    }

    public async Task PersistFallbackAsync(AskPreparedContext prepared, AskResponse response, CancellationToken cancellationToken) =>
        await PersistRunScopedTurnAsync(prepared, response, cancellationToken);

    public async Task PersistFindingTurnAsync(
        Guid threadId,
        string question,
        AskResponse response,
        CancellationToken cancellationToken)
    {
        string metadataJson = SerializeMetadata(response);

        await _conversationService.AppendAssistantMessageAsync(
            threadId,
            response.Answer,
            metadataJson,
            cancellationToken);

        await TryIndexFindingConversationAsync(threadId, question, response, metadataJson, cancellationToken);
    }

    public AskResponse Parse(Guid threadId, string? raw)
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

    private async Task PersistRunScopedTurnAsync(
        AskPreparedContext prepared,
        AskResponse response,
        CancellationToken cancellationToken)
    {
        string metadataJson = SerializeMetadata(response);

        await _conversationService.AppendAssistantMessageAsync(
            prepared.Thread.ThreadId,
            response.Answer,
            metadataJson,
            cancellationToken);

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

            IReadOnlyList<RetrievalDocument> convDocs = _retrievalDocumentBuilder.BuildForConversation(
                prepared.Scope.TenantId,
                prepared.Scope.WorkspaceId,
                prepared.Scope.ProjectId,
                prepared.EffectiveRunId,
                conversationTurn);

            await _retrievalIndexingService.IndexDocumentsAsync(convDocs, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to index Ask conversation turn for retrieval.");
        }
    }

    private async Task TryIndexFindingConversationAsync(
        Guid threadId,
        string question,
        AskResponse response,
        string metadataJson,
        CancellationToken cancellationToken)
    {
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

            IReadOnlyList<RetrievalDocument> convDocs = _retrievalDocumentBuilder.BuildForConversation(
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                null,
                conversationTurn);

            await _retrievalIndexingService.IndexDocumentsAsync(convDocs, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to index finding-ask conversation turn for retrieval.");
        }
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
            _logger.LogWarning(ex, "Failed to deserialize LLM Ask response as JSON; falling back to raw text.");

            return null;
        }
    }

    private static string SerializeMetadata(AskResponse response) =>
        JsonSerializer.Serialize(
            new { response.ReferencedDecisions, response.ReferencedFindings, response.ReferencedArtifacts },
            ContractJson.CamelCaseCompact);

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
