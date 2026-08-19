using System.Text.Json.Serialization;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Drafts;

/// <summary>A question selected for presentation during Socratic intake (ADR 0051).</summary>
public sealed class DraftElicitationQuestion
{
    [JsonPropertyName("questionKey")]
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("prompt")]
    public string Prompt
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("tier")]
    public ElicitationQuestionTier Tier
    {
        get;
        set;
    }

    [JsonPropertyName("answerKind")]
    public ElicitationAnswerKind AnswerKind
    {
        get;
        set;
    }

    [JsonPropertyName("source")]
    public ElicitationQuestionSource Source
    {
        get;
        set;
    }

    /// <summary>Linked governance rule keys when sourced from a pack (may be empty for L0).</summary>
    [JsonPropertyName("ruleKeys")]
    public List<string> RuleKeys
    {
        get;
        set;
    } = [];
}
