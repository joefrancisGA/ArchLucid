using System.Text.Json;

namespace ArchLucid.Core.Conversation;

/// <summary>Discovery projection. Holds only authorization proof and immutable row identity, never message content.</summary>
public sealed class ConversationProofRow
{
    public Guid MessageId { get; init; }
    public Guid ThreadId { get; init; }
    public string Role { get; init; } = string.Empty;
    public DateTime CreatedUtc { get; init; }
    public string? QuestionKey { get; init; }
    public string? AnswerProofJson { get; init; }

    public static ConversationProofRow FromStoredMetadata(ConversationMessage message)
    {
        string? questionKey = null;
        string? answerProof = null;
        try
        {
            using JsonDocument document = JsonDocument.Parse(message.MetadataJson ?? "{}");
            JsonElement root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Object)
            {
                if (message.Role == ConversationMessageRole.User &&
                    root.TryGetProperty("conversationQuestionKeyV1", out JsonElement question) &&
                    question.ValueKind == JsonValueKind.String)
                    questionKey = question.GetString();
                if (message.Role == ConversationMessageRole.Assistant &&
                    root.TryGetProperty("askEvidenceScopeV1", out JsonElement proof) &&
                    proof.ValueKind == JsonValueKind.Object)
                    answerProof = proof.GetRawText();
            }
        }
        catch (JsonException)
        {
            // Malformed legacy metadata cannot establish authorization.
        }

        return new ConversationProofRow
        {
            MessageId = message.MessageId, ThreadId = message.ThreadId, Role = message.Role,
            CreatedUtc = message.CreatedUtc, QuestionKey = questionKey, AnswerProofJson = answerProof,
        };
    }
}
