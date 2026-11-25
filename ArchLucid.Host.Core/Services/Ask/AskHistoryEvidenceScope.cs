using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Conversation;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Server-written provenance for a completed Ask turn, not an authorization grant.</summary>
public sealed record AskHistoryEvidenceScope(string ActorKey, string[] RunKeys, string QuestionKey)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static string Digest(Guid threadId, string kind, string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{threadId:N}|{kind}|{value}")));

    private static string? ActorKeyFor(Guid threadId, string actorId) =>
        string.IsNullOrWhiteSpace(actorId) || string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase)
            ? null
            : Digest(threadId, "actor", actorId);

    public static string CreateQuestionMetadata(Guid threadId, string question) =>
        string.IsNullOrWhiteSpace(question) ? "{}" :
        JsonSerializer.Serialize(new { conversationQuestionKeyV1 = Digest(threadId, "question", question) }, JsonOptions);

    public static AskHistoryEvidenceScope? Create(
        Guid threadId, string actorId, IReadOnlySet<Guid> authorizedRuns, string question, bool platformCorporaRequested)
    {
        string? key = ActorKeyFor(threadId, actorId);
        // Policy-pack assignment can change independently of run shares. Do not replay those turns.
        return key is null || platformCorporaRequested
            ? null
            : new AskHistoryEvidenceScope(key,
                authorizedRuns.OrderBy(id => id).Select(id => Digest(threadId, "run", id.ToString("D"))).ToArray(),
                Digest(threadId, "question", question));
    }

    public static AskHistoryEvidenceScope? CreateForDraft(
        Guid threadId, Guid draftId, Guid? architectureId, string actorId,
        IReadOnlySet<Guid> authorizedRuns, string question)
    {
        if (draftId == Guid.Empty || ActorKeyFor(threadId, actorId) is null)
            return null;

        return Create(threadId, DraftActor(draftId, architectureId, actorId),
            authorizedRuns, question, platformCorporaRequested: false);
    }

    public static IReadOnlyList<ConversationMessage> SelectVerifiedDraftTurns(
        IReadOnlyList<ConversationMessage> messages, Guid threadId, Guid draftId,
        Guid? architectureId, string actorId, IReadOnlySet<Guid> authorizedRuns)
    {
        if (draftId == Guid.Empty || ActorKeyFor(threadId, actorId) is null)
            return [];

        return SelectVerifiedTurnsCore(messages, threadId, DraftActor(draftId, architectureId, actorId),
            authorizedRuns, "draftIntakeEvidenceScopeV1");
    }

    private static string DraftActor(Guid draftId, Guid? architectureId, string actorId) =>
        $"draft:{draftId:N}:{architectureId:N}:{actorId}";

    public static IReadOnlyList<ConversationMessage> SelectVerifiedTurns(
        IReadOnlyList<ConversationMessage> messages, Guid threadId,
        string actorId, IReadOnlySet<Guid> authorizedRuns) =>
        SelectVerifiedTurnsCore(messages, threadId, actorId, authorizedRuns, "askEvidenceScopeV1");

    /// <summary>Authorizes immutable references without reading message content.</summary>
    public static IReadOnlyList<(ConversationProofRow Question, ConversationProofRow Answer)> SelectVerifiedTurnReferences(
        IReadOnlyList<ConversationProofRow> proofs, Guid threadId, string actorId, IReadOnlySet<Guid> authorizedRuns) =>
        SelectVerifiedPairs(
            proofs.Where(row => row.MessageId != Guid.Empty).Select(row => new TurnCandidate<ConversationProofRow>(
                row, row.ThreadId, row.Role, row.QuestionKey, ReadProof(row.AnswerProofJson))),
            threadId, actorId, authorizedRuns);

    private static IReadOnlyList<ConversationMessage> SelectVerifiedTurnsCore(
        IReadOnlyList<ConversationMessage> messages, Guid threadId,
        string actorId, IReadOnlySet<Guid> authorizedRuns, string proofProperty)
    {
        var pairs = SelectVerifiedPairs(
            messages.Select(message => new TurnCandidate<ConversationMessage>(
                message, message.ThreadId, message.Role,
                message.Role == ConversationMessageRole.User && !string.IsNullOrWhiteSpace(message.Content)
                    ? Digest(threadId, "question", message.Content) : null,
                message.Role == ConversationMessageRole.Assistant
                    ? ReadProof(message.MetadataJson, proofProperty) : null)),
            threadId, actorId, authorizedRuns);
        return pairs.SelectMany(pair => new[] { pair.Question, pair.Answer }).ToList();
    }

    private static IReadOnlyList<(T Question, T Answer)> SelectVerifiedPairs<T>(
        IEnumerable<TurnCandidate<T>> candidates, Guid threadId, string actorId, IReadOnlySet<Guid> authorizedRuns)
    {
        string? key = ActorKeyFor(threadId, actorId);
        if (key is null)
            return [];

        HashSet<string> currentRuns = authorizedRuns
            .Where(id => id != Guid.Empty)
            .Select(id => Digest(threadId, "run", id.ToString("D")))
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, T> priorQuestions = new(StringComparer.Ordinal);
        List<(T Question, T Answer)> verified = [];
        foreach (TurnCandidate<T> candidate in candidates)
        {
            if (candidate.ThreadId != threadId)
                continue;

            if (candidate.Role == ConversationMessageRole.User)
            {
                if (!string.IsNullOrWhiteSpace(candidate.QuestionKey))
                    priorQuestions[candidate.QuestionKey] = candidate.Row;
                continue;
            }

            AskHistoryEvidenceScope? previous = candidate.Proof;
            if (candidate.Role != ConversationMessageRole.Assistant || previous is null ||
                previous.ActorKey != key || previous.RunKeys is null ||
                previous.RunKeys.Any(runKey => !currentRuns.Contains(runKey)) ||
                string.IsNullOrWhiteSpace(previous.QuestionKey) ||
                !priorQuestions.TryGetValue(previous.QuestionKey, out T? question))
                continue;

            // Bind by digest, not adjacency. Requests can interleave.
            verified.Add((question, candidate.Row));
        }

        return verified;
    }

    private static AskHistoryEvidenceScope? ReadProof(string? json, string? property = null)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement proof = document.RootElement;
            if (proof.ValueKind != JsonValueKind.Object ||
                (property is not null && (!proof.TryGetProperty(property, out proof) ||
                                         proof.ValueKind != JsonValueKind.Object)))
                return null;

            return proof.Deserialize<AskHistoryEvidenceScope>(JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private readonly record struct TurnCandidate<T>(
        T Row, Guid ThreadId, string Role, string? QuestionKey, AskHistoryEvidenceScope? Proof);
}
