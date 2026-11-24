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

    public static IReadOnlyList<ConversationMessage> SelectVerifiedTurns(
        IReadOnlyList<ConversationMessage> messages, Guid threadId,
        string actorId, IReadOnlySet<Guid> authorizedRuns)
    {
        string? key = ActorKeyFor(threadId, actorId);
        if (key is null)
            return [];

        HashSet<string> currentRuns = authorizedRuns
            .Where(id => id != Guid.Empty)
            .Select(id => Digest(threadId, "run", id.ToString("D")))
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, ConversationMessage> priorQuestions = new(StringComparer.Ordinal);
        List<ConversationMessage> verified = [];
        foreach (ConversationMessage message in messages)
        {
            if (message.ThreadId != threadId)
                continue;

            if (message.Role == ConversationMessageRole.User)
            {
                if (!string.IsNullOrWhiteSpace(message.Content))
                    priorQuestions[Digest(threadId, "question", message.Content)] = message;
                continue;
            }

            if (message.Role != ConversationMessageRole.Assistant ||
                string.IsNullOrWhiteSpace(message.MetadataJson))
                continue;

            try
            {
                using JsonDocument json = JsonDocument.Parse(message.MetadataJson);
                if (json.RootElement.ValueKind != JsonValueKind.Object ||
                    !json.RootElement.TryGetProperty("askEvidenceScopeV1", out JsonElement proof) ||
                    proof.ValueKind != JsonValueKind.Object)
                    continue;

                AskHistoryEvidenceScope? previous = proof.Deserialize<AskHistoryEvidenceScope>(JsonOptions);
                if (previous is null || previous.ActorKey != key || previous.RunKeys is null ||
                    previous.RunKeys.Any(runKey => !currentRuns.Contains(runKey)) ||
                    string.IsNullOrWhiteSpace(previous.QuestionKey) ||
                    !priorQuestions.TryGetValue(previous.QuestionKey, out ConversationMessage? question))
                    continue;

                // The completed turn binds its question by digest. Never pair arbitrary adjacent
                // user rows (requests can interleave); do not persist duplicate question text or raw run IDs.
                verified.Add(question);
                verified.Add(message);
            }
            catch (JsonException)
            {
                // Missing/legacy/malformed provenance cannot be used for grounding.
            }
        }

        return verified;
    }
}
