using System.Text.Json;

using ArchLucid.Application.Ask;
using ArchLucid.Contracts.Findings;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Ask;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>
/// <see cref="IAskService"/> implementation: conversation thread + structured JSON context + optional retrieval + LLM JSON answer shape.
/// </summary>
/// <remarks>
/// Retrieval and post-answer indexing failures are logged and do not fail the request. LLM failures return a short fallback <see cref="AskResponse"/>.
/// </remarks>
public sealed class AskService(
    IAgentCompletionClient llm,
    IConversationService conversationService,
    IFindingInspectReadRepository findingInspectReadRepository,
    IAuthorityQueryService authorityQueryService,
    AskContextPreparer contextPreparer,
    AskComparisonNarrativeBuilder comparisonNarrativeBuilder,
    AskResponseComposer responseComposer,
    AskConversationHistoryBuilder conversationHistoryBuilder,
    FindingInstrumentationAuditSupport findingInstrumentationAudit,
    IActorContext actorContext,
    ILogger<AskService> logger,
    IAskEvidenceAccess evidenceAccess) : IAskService
{
    private const int HistoryTake = 40;

    private readonly IAskEvidenceAccess _evidenceAccess =
        evidenceAccess ?? throw new ArgumentNullException(nameof(evidenceAccess));

    private const string ArchitectSystemPrompt =
        "You are a senior enterprise architect. " +
        "Use ONLY the provided architecture context JSON, conversation history, and retrieved evidence. " +
        "Be precise and technical. Reference decisions by Title and SelectedOption (and DecisionId when helpful). " +
        "Do not invent services, findings, artifacts, or costs not present in the supplied materials. " +
        "If something is unknown from the supplied data, say so. " +
        "When you quote or rely on findings, inherit the weakest semantic support band among cited findings and do not sound more certain than that band (AS-069 / ADR 0085). " +
        "Ask is advisory working context — not the sealed review record (TB-1003). " +
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
        "Inherit the finding's semantic support band and do not sound more certain than that band (AS-069 / ADR 0085). " +
        "Ask is advisory working context — not the sealed review record (TB-1003). " +
        "Respond with a single JSON object only (no markdown fences), keys: " +
        "answer (string), referencedDecisions (array of strings), referencedFindings (array of strings), referencedArtifacts (array of strings).";

    private readonly IAgentCompletionClient _llm =
        llm ?? throw new ArgumentNullException(nameof(llm));

    private readonly IConversationService _conversationService =
        conversationService ?? throw new ArgumentNullException(nameof(conversationService));

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly AskContextPreparer _contextPreparer =
        contextPreparer ?? throw new ArgumentNullException(nameof(contextPreparer));

    private readonly AskComparisonNarrativeBuilder _comparisonNarrativeBuilder =
        comparisonNarrativeBuilder ?? throw new ArgumentNullException(nameof(comparisonNarrativeBuilder));

    private readonly AskResponseComposer _responseComposer =
        responseComposer ?? throw new ArgumentNullException(nameof(responseComposer));

    private readonly AskConversationHistoryBuilder _conversationHistoryBuilder =
        conversationHistoryBuilder ?? throw new ArgumentNullException(nameof(conversationHistoryBuilder));

    private readonly FindingInstrumentationAuditSupport _findingInstrumentationAudit =
        findingInstrumentationAudit ?? throw new ArgumentNullException(nameof(findingInstrumentationAudit));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly ILogger<AskService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<AskResponse> AskAsync(AskRequest request, ScopeContext scope, CancellationToken ct)
    {
        AskPreparedContext prepared = await _contextPreparer.PrepareAsync(request, scope, ct);
        string? comparisonNarrative = await _comparisonNarrativeBuilder.TryBuildAsync(prepared, ct);
        string userPrompt = BuildUserPrompt(prepared);

        string? raw;
        try
        {
            raw = await _llm.CompleteJsonAsync(
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
            _logger.LogWarning(ex, "LLM completion failed for Ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            AskResponse fallback = _responseComposer.BuildFallbackResponse(prepared);
            await _responseComposer.PersistFallbackAsync(prepared, fallback, ct);
            fallback.ComparisonNarrative = comparisonNarrative;

            return fallback;
        }

        AskResponse response = await _responseComposer.FinalizeAsync(prepared, raw, ct);
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

        AskPreparedContext prepared = await _contextPreparer.PrepareAsync(request, scope, ct);
        string? comparisonNarrative = await _comparisonNarrativeBuilder.TryBuildAsync(prepared, ct);
        string userPrompt = BuildUserPrompt(prepared);
        StreamingJsonAnswerExtractor extractor = new();

        string? raw;
        try
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               _llm,
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
            _logger.LogWarning(ex, "LLM streaming failed for Ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            AskResponse streamFallback = _responseComposer.BuildFallbackResponse(prepared);
            await _responseComposer.PersistFallbackAsync(prepared, streamFallback, ct);
            streamFallback.ComparisonNarrative = comparisonNarrative;

            return streamFallback;
        }

        AskResponse streamResponse = await _responseComposer.FinalizeAsync(prepared, raw, ct);
        streamResponse.ComparisonNarrative = comparisonNarrative;

        return streamResponse;
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

        string actorId = _evidenceAccess.GetAuthorizedActorId()
            ?? throw new InvalidOperationException("Finding evidence is not available for the current caller.");
        if (string.IsNullOrWhiteSpace(actorId))
            throw new InvalidOperationException("Finding evidence is not available for the current caller.");

        string findingId = request.FindingId.ToString("N");
        Guid? ownerRunId = await _findingInspectReadRepository.GetRunIdByFindingIdAsync(scope, findingId, ct);
        if (ownerRunId is not Guid runId || runId == Guid.Empty ||
            !await _evidenceAccess.CanReadRunAsync(scope, runId, ct))
            throw new InvalidOperationException("Finding evidence is not available for the current caller.");

        // Constrain the full read to the authorized owner, even if another run now has this finding ID.
        Contracts.Findings.FindingInspectResponse? finding =
            await _findingInspectReadRepository.GetInspectAsync(scope, findingId, ct,
                new FindingInspectReadOptions { ExpectedRunId = runId });
        if (finding is null || finding.RunId != runId)
            throw new InvalidOperationException("Finding evidence is not available for the current caller.");

        await FindingInspectPinnedEvidenceGuard.EnsureInspectEvidenceInventoryBoundOrThrowAsync(
            finding,
            scope,
            _authorityQueryService,
            ct);

        ConversationThread thread = await _conversationService.GetOrCreateThreadAsync(
            request.ThreadId, scope.TenantId, scope.WorkspaceId, scope.ProjectId,
            runId, baseRunId: null, targetRunId: null, ct);

        if (thread.RunId != runId || thread.BaseRunId.HasValue || thread.TargetRunId.HasValue)
            throw new ArgumentException("Start a new thread for this finding's run.", nameof(request));

        string question = request.Question.Trim();
        HashSet<Guid> authorizedRuns = [runId];
        IReadOnlyList<ConversationMessage> historyWindow =
            await _conversationService.GetHistoryAsync(thread.ThreadId, HistoryTake, ct);
        IReadOnlyList<ConversationMessage> priorMessages = AskHistoryEvidenceScope.SelectVerifiedTurns(
            historyWindow, thread.ThreadId, actorId, authorizedRuns);
        string historyText = await _conversationHistoryBuilder.BuildHistoryTextAsync(priorMessages, ct);
        await _conversationService.AppendUserMessageAsync(thread.ThreadId, question, ct);
        AskHistoryEvidenceScope? historyEvidence = AskHistoryEvidenceScope.Create(
            thread.ThreadId, actorId, authorizedRuns, question, platformCorporaRequested: false);

        FindingSemanticSupportBand? semanticSupportBand =
            AskCitedFindingsSemanticSupportBandHonesty.TryReadBandFromFindingInspect(finding);

        object findingContext = new
        {
            findingId = finding.FindingId,
            severity = finding.Severity.ToString(),
            semanticSupportBand = semanticSupportBand?.ToString(),
            typedPayload = finding.TypedPayload,
            evidenceRefs = finding.Evidence.Select(e => e.Excerpt).Where(static e => !string.IsNullOrWhiteSpace(e)).ToArray(),
            recommendedActions = finding.RecommendedActions,
            reasoningSummary = finding.ReasoningSummary
        };

        string contextJson = JsonSerializer.Serialize(findingContext, ContractJson.CamelCaseIgnoreNullCompact);
        string semanticSupportConstraint = semanticSupportBand is null
            ? string.Empty
            : AskCitedFindingsSemanticSupportBandHonesty.BuildPromptConstraintSection(
                [new AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry(
                    finding.FindingId,
                    finding.FindingId,
                    semanticSupportBand.Value)]);
        string userPrompt =
            "Conversation History:\n" +
            (string.IsNullOrWhiteSpace(historyText) ? "(none)\n" : historyText + "\n") +
            "\nFinding Context:\n" +
            contextJson +
            (semanticSupportConstraint.Length > 0 ? "\n\n" + semanticSupportConstraint : string.Empty) +
            "\n\nUser Question:\n" +
            question;

        string? raw;
        try
        {
            raw = await _llm.CompleteJsonAsync(
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
            _logger.LogWarning(ex, "LLM completion failed for finding ask (ThreadId={ThreadId}); returning fallback response.",
                LogSanitizer.Sanitize(thread.ThreadId.ToString()));

            AskResponse fallback = _responseComposer.BuildFindingFallbackResponse(thread.ThreadId);
            await _responseComposer.PersistFindingTurnAsync(thread.ThreadId, fallback, historyEvidence, ct);
            await LogFindingAskConversationPersistedAsync(scope, findingId, finding.RunId, thread.ThreadId, ct);

            return fallback;
        }

        AskResponse response = _responseComposer.Parse(thread.ThreadId, raw);
        await _responseComposer.PersistFindingTurnAsync(thread.ThreadId, response, historyEvidence, ct);
        await LogFindingAskConversationPersistedAsync(scope, findingId, finding.RunId, thread.ThreadId, ct);

        return response;
    }

    private Task LogFindingAskConversationPersistedAsync(
        ScopeContext scope,
        string findingId,
        Guid runId,
        Guid threadId,
        CancellationToken cancellationToken) =>
        _findingInstrumentationAudit.LogAskConversationPersistedAsync(
            scope,
            _actorContext.GetActor(),
            findingId,
            runId,
            threadId,
            cancellationToken);

    private static string BuildUserPrompt(AskPreparedContext prepared) =>
        AskUserPromptComposer.BuildUserPrompt(
            prepared.ContextJson,
            prepared.RetrievalContext,
            prepared.RetrievalDegraded,
            prepared.HistoryText,
            prepared.Question,
            prepared.FindingBandIndex);
}
