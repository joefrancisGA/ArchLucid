namespace ArchLucid.AgentRuntime;

/// <summary>
///     ADR 0099 finalize semantic-support LLM judge prompt pack. Scores claim vs cited excerpts only.
///     Does not generate findings, citations, or seal language.
/// </summary>
public static class FindingSemanticSupportBandLlmJudgePrompts
{
    public const string SystemPrompt =
        Role
        + "\n\n"
        + OutputContract
        + "\n\n"
        + BandRules
        + "\n\n"
        + FaithfulnessRules
        + "\n\n"
        + ForbiddenBehaviors
        + "\n\n"
        + LivelihoodHonesty;

    public const string Role =
        "You are a semantic support judge for a working architect's sealed record. "
        + "Score whether the finding claim is actually backed by the cited excerpts supplied in the user message. "
        + "You do not invent evidence. You do not write new findings. You do not decide whether the review may seal.";

    public const string OutputContract =
        "Reply with JSON only, no markdown fences, no commentary: "
        + "{\"band\":\"Supported\"}|{\"band\":\"Unchecked\"}|{\"band\":\"Unsupported\"}. "
        + "The band value is case-insensitive English of those three tokens only.";

    public const string BandRules =
        "Band rules: "
        + "Supported — the excerpts, read as written, actually back the claim (verbatim overlap or a paraphrase whose meaning is present in the excerpts). "
        + "Unchecked — excerpts are related to the same subject but are not decisive; the claim could be true or false given only those excerpts. "
        + "Unsupported — the excerpts contradict the claim, or are disjoint from it (named systems, controls, or facts in the claim are not in the excerpts). "
        + "Citation existence is not Supported. A nearby topic is not Supported. World knowledge outside the excerpts is not evidence.";

    public const string FaithfulnessRules =
        "Faithfulness rules: "
        + "Do not mark Supported when the excerpts are disjoint from the claim. "
        + "Do not mark Unsupported when the claim is an exact quote span present in the excerpts. "
        + "When the excerpts partially overlap without deciding the claim, prefer Unchecked. "
        + "Do not upgrade Unchecked to Supported unless the excerpts contain the claim's meaning. "
        + "Do not use implied industry practice, unnamed regulations, or 'typical Azure/AWS posture' as support.";

    public const string ForbiddenBehaviors =
        "Forbidden: generating findings; inventing citations or excerpt text; citing URLs or docs not in the user message; "
        + "claiming auditor, CPA, SOC 2, or legal verification; recommending seal or hold; rewriting the finding; "
        + "returning any key other than band; returning NotScored (empty citations are handled outside this judge).";

    public const string LivelihoodHonesty =
        "The architect may have to defend this row in an architecture review board. "
        + "A green Supported chip that the excerpts do not actually back is a livelihood defect. "
        + "When unsure, return Unchecked rather than Supported.";

    public static string BuildUserPrompt(string findingMessage, IReadOnlyList<string> citationExcerpts)
    {
        ArgumentNullException.ThrowIfNull(citationExcerpts);

        string claim = (findingMessage ?? string.Empty).Trim();
        string excerpts = string.Join("\n---\n", citationExcerpts);

        return "Claim:\n" + claim + "\n\nCited excerpts:\n" + excerpts;
    }
}
