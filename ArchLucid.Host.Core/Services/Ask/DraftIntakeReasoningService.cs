using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Services.Ask;

/// <inheritdoc cref="IDraftIntakeReasoningService" />
public sealed class DraftIntakeReasoningService(
    IDraftRequestRepository draftRepository,
    IConversationService conversationService,
    IAgentCompletionClient completionClient,
    ILogger<DraftIntakeReasoningService> logger) : IDraftIntakeReasoningService
{
    private const int HistoryTake = 20;

    private const string IntakeUserPromptStaticPrefix =
        "Use ONLY the draft context JSON, conversation history, and latest message sections below.\n\n";

    private const string IntakeSystemPrompt =
        "You are an enterprise architecture intake assistant helping an expert operator shape vague " +
        "business intent into a designable request before any architecture run exists. " +
        "Use ONLY the supplied draft context JSON and conversation history. " +
        "Do not invent committed manifests, findings, or topology that are not in the draft. " +
        "When you infer actors, outcomes, or constraints, say so plainly and suggest what the operator should confirm. " +
        "Prefer concise, actionable clarifying questions aligned to Well-Architected pillars and the actor model. " +
        "Respond with a single JSON object only (no markdown fences), keys: answer (string).";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IConversationService _conversationService =
        conversationService ?? throw new ArgumentNullException(nameof(conversationService));

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<DraftIntakeReasoningService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<DraftIntakeReasonResponse?> ReasonAsync(
        Guid draftId,
        DraftIntakeReasonRequest request,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(request.Message))
            throw new InvalidOperationException("Message is required.");

        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        if (draft is null)
            return null;

        if (!DraftRequestStateMachine.AllowsReasoning(draft.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not accept reasoning in status '{draft.Status}'.");
        }

        string message = request.Message.Trim();

        ConversationThread thread = await _conversationService.GetOrCreateThreadAsync(
            draft.Document.ConversationThreadId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId: null,
            baseRunId: null,
            targetRunId: null,
            cancellationToken);

        if (!draft.Document.ConversationThreadId.HasValue)
        {
            draft.Document.ConversationThreadId = thread.ThreadId;

            draft = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                draft.Status,
                draft.Document,
                draft.RedirectReason,
                draft.SpawnedRunId,
                cancellationToken)
                ?? throw new InvalidOperationException($"Draft '{draftId}' could not persist conversation thread.");
        }

        await _conversationService.AppendUserMessageAsync(thread.ThreadId, message, cancellationToken);

        IReadOnlyList<ConversationMessage> history =
            await _conversationService.GetHistoryAsync(thread.ThreadId, HistoryTake, cancellationToken);

        string historyText = BuildHistoryText(history);
        string contextJson = DraftIntakeReasoningContextBuilder.BuildContextJson(draft.Document);
        string userPrompt =
            IntakeUserPromptStaticPrefix +
            $"Draft context JSON:\n{contextJson}\n\nConversation history:\n{historyText}\n\nLatest message:\n{message}";

        string answer = await TryCompleteAnswerAsync(thread.ThreadId, userPrompt, cancellationToken);

        await _conversationService.AppendAssistantMessageAsync(
            thread.ThreadId,
            answer,
            metadataJson: "{}",
            cancellationToken);

        return new DraftIntakeReasonResponse
        {
            DraftId = draftId,
            ConversationThreadId = thread.ThreadId,
            Status = draft.Status,
            Answer = answer,
        };
    }

    private async Task<string> TryCompleteAnswerAsync(
        Guid threadId,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        try
        {
            string raw = await _completionClient.CompleteJsonAsync(
                IntakeSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: cancellationToken);

            IntakeAnswerShape? parsed = JsonSerializer.Deserialize<IntakeAnswerShape>(raw, JsonRead);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.Answer))
                return "I could not produce a structured intake answer. Please rephrase or add more design intent.";

            return parsed.Answer.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "LLM completion failed for draft intake reasoning (ThreadId={ThreadId}).",
                threadId);

            return "Intake reasoning is temporarily unavailable. You can continue patching the draft manually.";
        }
    }

    private static string BuildHistoryText(IReadOnlyList<ConversationMessage> history)
    {
        if (history.Count == 0)
            return "(none)";

        IEnumerable<string> lines = history.Select(static message =>
            $"{message.Role}: {message.Content.Trim()}");

        return string.Join("\n", lines);
    }

    private sealed class IntakeAnswerShape
    {
        [JsonPropertyName("answer")]
        public string? Answer
        {
            get;
            init;
        }
    }
}
