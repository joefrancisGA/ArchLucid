using System.Text.Json.Serialization;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     An elicitation question that was offered but not answered before the verdict (ADR 0050 / R4).
/// </summary>
/// <remarks>
///     Appears in <see cref="TransparencyTrail.Skipped" />.  Skipped <see cref="ElicitationQuestionTier.Must" />
///     questions are especially material — they explain why a verdict may carry lower confidence
///     even when the user proceeded without answering.
/// </remarks>
public sealed class SkippedQuestionTrailEntry
{
    /// <summary>
    ///     The <see cref="ElicitationQuestion.QuestionKey" /> of the unanswered question.
    /// </summary>
    [JsonPropertyName("questionKey")]
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Whether the skipped question was MUST or SHOULD tier.</summary>
    [JsonPropertyName("tier")]
    public ElicitationQuestionTier Tier
    {
        get;
        set;
    }
}
