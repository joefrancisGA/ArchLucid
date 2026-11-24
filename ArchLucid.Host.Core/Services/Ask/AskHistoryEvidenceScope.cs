using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Conversation;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Server-written provenance for a completed Ask turn, not an authorization grant.</summary>
public sealed record AskHistoryEvidenceScope(string ActorKey, Guid[] RunIds, string Question)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string? ActorKeyFor(string actorId) =>
        string.IsNullOrWhiteSpace(actorId) || string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase)
            ? null
            : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(actorId)));

    public static AskHistoryEvidenceScope? Create(
        string actorId, IReadOnlySet<Guid> authorizedRuns, string question, bool platformCorporaRequested)
    {
        string? key = ActorKeyFor(actorId);
        // Policy-pack assignment can change independently of run shares. Do not replay those turns.
        return key is null || platformCorporaRequested
            ? null
            : new AskHistoryEvidenceScope(key, authorizedRuns.OrderBy(id => id).ToArray(), question);
    }

    public static IReadOnlyList<ConversationMessage> SelectVerifiedTurns(
        IReadOnlyList<ConversationMessage> messages, Guid threadId,
        string actorId, IReadOnlySet<Guid> authorizedRuns)
    {
        string? key = ActorKeyFor(actorId);
        if (key is null)
            return [];

        List<ConversationMessage> verified = [];
        foreach (ConversationMessage message in messages)
        {
            if (message.ThreadId != threadId ||
                message.Role != ConversationMessageRole.Assistant ||
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
                if (previous is null || previous.ActorKey != key || previous.RunIds is null ||
                    previous.RunIds.Any(id => id == Guid.Empty || !authorizedRuns.Contains(id)) ||
                    string.IsNullOrWhiteSpace(previous.Question))
                    continue;

                // The question is captured in the completed server-written turn. Do not associate
                // arbitrary adjacent user rows (requests can interleave or be from other actors).
                verified.Add(new ConversationMessage
                {
                    ThreadId = threadId,
                    Role = ConversationMessageRole.User,
                    Content = previous.Question,
                });
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
