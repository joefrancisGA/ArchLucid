using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Conversation;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Reads conversation bodies only for completed turns with current caller and evidence proof.</summary>
public static class ConversationHistoryReader
{
    public static Task<IReadOnlyList<ConversationMessage>> ReadAskAsync(
        IConversationMessageRepository repository, ScopeContext scope, Guid threadId, int take,
        string actorId, IReadOnlySet<Guid> authorizedRuns, CancellationToken ct) =>
        ReadAsync(repository, scope, threadId, take, actorId, authorizedRuns, null, null, ct);

    public static Task<IReadOnlyList<ConversationMessage>> ReadDraftAsync(
        IConversationMessageRepository repository, ScopeContext scope, Guid threadId, int take,
        Guid draftId, Guid? architectureId, string actorId, IReadOnlySet<Guid> authorizedRuns, CancellationToken ct) =>
        draftId == Guid.Empty ? Task.FromResult<IReadOnlyList<ConversationMessage>>([]) :
        ReadAsync(repository, scope, threadId, take, actorId, authorizedRuns, draftId, architectureId, ct);

    private static async Task<IReadOnlyList<ConversationMessage>> ReadAsync(
        IConversationMessageRepository repository, ScopeContext scope, Guid threadId, int take,
        string actorId, IReadOnlySet<Guid> authorizedRuns, Guid? draftId, Guid? architectureId, CancellationToken ct)
    {
        IReadOnlyList<ConversationProofRow> proofs = await repository.GetRecentProofsAsync(scope, threadId, take, ct);
        var pairs = draftId is Guid draft
            ? AskHistoryEvidenceScope.SelectVerifiedDraftTurnReferences(proofs, threadId, draft, architectureId, actorId, authorizedRuns)
            : AskHistoryEvidenceScope.SelectVerifiedTurnReferences(proofs, threadId, actorId, authorizedRuns);
        if (pairs.Count == 0)
            return [];

        var ids = pairs.SelectMany(pair => new[] { pair.Question.MessageId, pair.Answer.MessageId }).ToHashSet();
        IReadOnlyList<ConversationMessage> payloads = await repository.GetAuthorizedMessagesAsync(scope, threadId, ids, ct);
        if (payloads.Count != ids.Count || !ids.SetEquals(payloads.Select(m => m.MessageId)) ||
            payloads.Any(m => m.ThreadId != threadId))
            return [];

        // Rebind the hydrated question and proof rather than trusting a mutable or incomplete projection.
        return draftId is Guid verifiedDraft
            ? AskHistoryEvidenceScope.SelectVerifiedDraftTurns(payloads, threadId, verifiedDraft, architectureId, actorId, authorizedRuns)
            : AskHistoryEvidenceScope.SelectVerifiedTurns(payloads, threadId, actorId, authorizedRuns);
    }
}
