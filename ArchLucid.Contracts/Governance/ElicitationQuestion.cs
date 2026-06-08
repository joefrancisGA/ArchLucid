using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     A single elicitation question owned by a policy pack (ADR 0051 / R8).
/// </summary>
/// <remarks>
///     <para>
///         Each question is linked to the pack rules it informs via <see cref="RuleKeys" />.
///         The validator asserts that every entry in <see cref="RuleKeys" /> references a rule key
///         that exists in the same pack version's <c>complianceRuleKeys</c> collection.
///     </para>
///     <para>
///         Questions are versioned with the pack: changing a question prompt, tier, or rule-key
///         mapping requires a SemVer uplift (no silent row mutation per ADR 0051 / R9).
///     </para>
/// </remarks>
public sealed class ElicitationQuestion
{
    /// <summary>
    ///     Stable, unique key within the pack (e.g. <c>network-encryption-at-rest</c>).
    ///     Max 200 characters; must be non-empty.
    /// </summary>
    [JsonPropertyName("questionKey")]
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Human-readable question text presented to the user in the Socratic intake loop.
    ///     Max 1 000 characters; must be non-empty.
    /// </summary>
    [JsonPropertyName("prompt")]
    public string Prompt
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Whether this question must be answered before the draft may be submitted
    ///     (<see cref="ElicitationQuestionTier.Must" />) or only improves confidence
    ///     (<see cref="ElicitationQuestionTier.Should" />).
    /// </summary>
    [JsonPropertyName("tier")]
    public ElicitationQuestionTier Tier
    {
        get;
        set;
    }

    /// <summary>The expected answer data type.</summary>
    [JsonPropertyName("answerKind")]
    public ElicitationAnswerKind AnswerKind
    {
        get;
        set;
    }

    /// <summary>
    ///     The <c>complianceRuleKeys</c> in the same pack that this question informs.
    ///     Every entry must match a key present in the owning pack's
    ///     <see cref="PolicyPackContentDocument.ComplianceRuleKeys" />.
    ///     May be empty when a question is cross-cutting (not specific to a single rule).
    /// </summary>
    [JsonPropertyName("ruleKeys")]
    public List<string> RuleKeys
    {
        get;
        set;
    } = [];
}
