using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Planning;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Conversation;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Services.Ask;

/// <inheritdoc cref="IDraftIntakeReasoningService" />
public sealed class DraftIntakeReasoningService(
    IDraftRequestRepository draftRepository,
    IConversationService conversationService,
    IAgentCompletionClient completionClient,
    ILogger<DraftIntakeReasoningService> logger,
    IAskEvidenceAccess evidenceAccess,
    IConversationThreadRepository threadRepository) : IDraftIntakeReasoningService
{
    private const int HistoryTake = 20;

    private readonly IAskEvidenceAccess _evidenceAccess =
        evidenceAccess ?? throw new ArgumentNullException(nameof(evidenceAccess));

    private readonly IConversationThreadRepository _threadRepository =
        threadRepository ?? throw new ArgumentNullException(nameof(threadRepository));

    private const string IntakeUserPromptStaticPrefix =
        "Use ONLY the draft context JSON, conversation history, and latest message sections below.\n\n";

    private const string IntakeSystemPrompt =
        "You are an enterprise architecture intake assistant helping an expert operator shape vague " +
        "business intent into a designable request before any architecture run exists. " +
        DraftIntakeReasoningLlmPrompts.SimulatorRoutingMarker + " " +
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

        string? actorId = _evidenceAccess.GetAuthorizedDraftActorId();
        if (string.IsNullOrWhiteSpace(actorId) ||
            string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase) ||
            draftId == Guid.Empty || scope.TenantId == Guid.Empty ||
            scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty)
            return null;

        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        if (draft is null)
            return null;

        HashSet<Guid>? authorizedRuns = await AuthorizeDraftAsync(draft, draftId, scope, actorId, cancellationToken);
        if (authorizedRuns is null)
            return null;

        if (!DraftRequestStateMachine.AllowsReasoning(draft.Status))
        {
            throw new InvalidOperationException(
                $"Draft '{draftId}' does not accept reasoning in status '{draft.Status}'.");
        }

        string message = request.Message.Trim();

        ConversationThread? thread = null;
        IReadOnlyList<ConversationMessage> verifiedHistory = [];

        // The stored document pointer is not proof of thread ownership. Never read an
        // anchored review/comparison thread or append to an unproven draft conversation.
        if (draft.Document.ConversationThreadId is Guid linkedThreadId && linkedThreadId != Guid.Empty)
        {
            ConversationThread? candidate = await _threadRepository.GetByIdAsync(linkedThreadId, cancellationToken);
            if (candidate is not null && candidate.ThreadId == linkedThreadId &&
                IsUnanchoredInScope(candidate, scope))
            {
                IReadOnlyList<ConversationMessage> history = await _conversationService.GetHistoryAsync(
                    candidate.ThreadId, HistoryTake, cancellationToken);
                verifiedHistory = AskHistoryEvidenceScope.SelectVerifiedDraftTurns(
                    history, candidate.ThreadId, draftId, draft.ArchitectureId, actorId, authorizedRuns);
                if (verifiedHistory.Count > 0)
                    thread = candidate;
            }
        }

        if (thread is null)
        {
            // Legacy/missing/foreign pointers are detached, not deleted or modified.
            thread = await _conversationService.GetOrCreateThreadAsync(
                null, scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                runId: null, baseRunId: null, targetRunId: null, cancellationToken);
            if (!IsUnanchoredInScope(thread, scope) || thread.ThreadId == draft.Document.ConversationThreadId)
                return null;

            DraftRequestDocument document = DraftRequestDocumentCloner.Clone(draft.Document);
            document.ConversationThreadId = thread.ThreadId;
            Guid? previousArchitectureId = draft.ArchitectureId;

            draft = await _draftRepository.UpdateAsync(
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId,
                draft.Status, document, draft.RedirectReason, draft.SpawnedRunId,
                cancellationToken);
            if (draft is null || draft.Document.ConversationThreadId != thread.ThreadId ||
                draft.ArchitectureId != previousArchitectureId || !DraftRequestStateMachine.AllowsReasoning(draft.Status))
                return null;

            authorizedRuns = await AuthorizeDraftAsync(draft, draftId, scope, actorId, cancellationToken);
            if (authorizedRuns is null)
                return null;
        }

        await _conversationService.AppendUserMessageAsync(thread.ThreadId, message, cancellationToken);

        string historyText = BuildHistoryText(verifiedHistory);
        string contextJson = DraftIntakeReasoningContextBuilder.BuildContextJson(draft.Document);
        string userPrompt =
            IntakeUserPromptStaticPrefix +
            $"Draft context JSON:\n{contextJson}\n\nConversation history:\n{historyText}\n\nLatest message:\n{message}";

        string answer = await TryCompleteAnswerAsync(thread.ThreadId, userPrompt, cancellationToken);

        AskHistoryEvidenceScope? proof = AskHistoryEvidenceScope.CreateForDraft(
            thread.ThreadId, draftId, draft.ArchitectureId, actorId, authorizedRuns, message);
        await _conversationService.AppendAssistantMessageAsync(
            thread.ThreadId,
            answer,
            JsonSerializer.Serialize(new { draftIntakeEvidenceScopeV1 = proof },
                new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            cancellationToken);

        return new DraftIntakeReasonResponse
        {
            DraftId = draftId,
            ConversationThreadId = thread.ThreadId,
            Status = draft.Status,
            Answer = answer,
        };
    }

    private async Task<HashSet<Guid>?> AuthorizeDraftAsync(
        DraftRequestResponse draft, Guid draftId, ScopeContext scope, string actorId, CancellationToken ct)
    {
        if (draft.DraftId != draftId || draft.TenantId != scope.TenantId ||
            draft.WorkspaceId != scope.WorkspaceId || draft.ProjectId != scope.ProjectId)
            return null;

        if (draft.ArchitectureId is Guid architectureId)
        {
            if (architectureId == Guid.Empty ||
                !await _evidenceAccess.CanDecideArchitectureAsync(scope, architectureId, ct))
                return null;
        }
        else if (!string.Equals(draft.CreatedByUserId, actorId, StringComparison.Ordinal))
        {
            // A legacy draft without a linked architecture has no share record.
            // Do not treat that absence as project-wide ownership.
            return null;
        }

        HashSet<Guid> runs = [];
        foreach (string? anchor in new[] { draft.Document.PriorRunId, draft.SpawnedRunId })
        {
            if (string.IsNullOrWhiteSpace(anchor))
                continue;
            if (!Guid.TryParse(anchor, out Guid runId) || runId == Guid.Empty)
                return null;
            if (runs.Add(runId) && !await _evidenceAccess.CanReadRunAsync(scope, runId, ct))
                return null;
        }

        return runs;
    }

    private static bool IsUnanchoredInScope(ConversationThread thread, ScopeContext scope) =>
        thread.ThreadId != Guid.Empty && !thread.ArchivedUtc.HasValue &&
        thread.TenantId == scope.TenantId && thread.WorkspaceId == scope.WorkspaceId &&
        thread.ProjectId == scope.ProjectId && !thread.RunId.HasValue &&
        !thread.BaseRunId.HasValue && !thread.TargetRunId.HasValue;

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

            return ParseAnswerOrFallback(threadId, raw);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (InvalidOperationException ex) when (
            ex.Message.Contains(DevSwitchableAgentCompletionClient.LiveCompletionUnavailableMessage, StringComparison.Ordinal))
        {
            return DevSwitchableAgentCompletionClient.LiveCompletionUnavailableMessage;
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

    private string ParseAnswerOrFallback(Guid threadId, string? raw)
    {
        string? normalized = UnwrapJsonFence(raw);
        IntakeAnswerShape? parsed = TryDeserializeAnswer(normalized);

        if (parsed is not null && !string.IsNullOrWhiteSpace(parsed.Answer))
            return parsed.Answer.Trim();

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            _logger.LogWarning(
                "Draft intake reasoning response was not JSON with an answer key (ThreadId={ThreadId}); using raw text.",
                threadId);

            return normalized.Trim();
        }

        return "I could not produce a structured intake answer. Please rephrase or add more design intent.";
    }

    private IntakeAnswerShape? TryDeserializeAnswer(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<IntakeAnswerShape>(json, JsonRead);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize draft intake reasoning JSON; falling back to raw text.");

            return null;
        }
    }

    private static string? UnwrapJsonFence(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return raw;

        string text = raw.Trim();

        if (!text.StartsWith("```", StringComparison.Ordinal))
            return text;

        int firstNewline = text.IndexOf('\n');

        if (firstNewline > 0)
            text = text[(firstNewline + 1)..].Trim();

        int fenceEnd = text.LastIndexOf("```", StringComparison.Ordinal);

        if (fenceEnd > 0)
            text = text[..fenceEnd].Trim();

        return text;
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
