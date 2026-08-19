using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Shared L0 MUST completeness over <see cref="UniversalIntakeQuestions" /> (TB-2283 / ADR 0051).
/// </summary>
public static class UniversalIntakeMustQuestionCompleteness
{
    /// <summary>Canonical MUST keys in stable order.</summary>
    public static IReadOnlyList<string> RequiredMustQuestionKeys { get; } =
        UniversalIntakeQuestions.MustQuestions.Select(static question => question.QuestionKey).ToList();

    /// <summary>
    ///     Returns MUST keys that still lack a non-empty answer and are not explicitly skipped in the transparency trail.
    /// </summary>
    public static IReadOnlyList<string> EvaluateMissingKeys(
        IReadOnlyDictionary<string, string> questionAnswers,
        TransparencyTrail? transparencyTrail,
        IReadOnlyList<string>? requiredMustQuestionKeys = null)
    {
        ArgumentNullException.ThrowIfNull(questionAnswers);

        IReadOnlyList<string> requiredKeys = requiredMustQuestionKeys ?? RequiredMustQuestionKeys;
        List<string> missing = [];

        foreach (string mustKey in requiredKeys)
        {
            if (IsSatisfied(mustKey, questionAnswers, transparencyTrail))
                continue;

            missing.Add(mustKey);
        }

        return missing;
    }

    /// <summary>
    ///     Throws when any required MUST key is unanswered and not explicitly skipped (ADR 0050 / R4).
    /// </summary>
    public static void EnsureComplete(
        IReadOnlyDictionary<string, string> questionAnswers,
        TransparencyTrail? transparencyTrail,
        IReadOnlyList<string>? requiredMustQuestionKeys = null)
    {
        foreach (string mustKey in EvaluateMissingKeys(questionAnswers, transparencyTrail, requiredMustQuestionKeys))
        {
            throw new InvalidOperationException($"MUST question '{mustKey}' must be answered before submit.");
        }
    }

    private static bool IsSatisfied(
        string mustKey,
        IReadOnlyDictionary<string, string> questionAnswers,
        TransparencyTrail? transparencyTrail)
    {
        if (questionAnswers.TryGetValue(mustKey, out string? answer) && !string.IsNullOrWhiteSpace(answer))
            return true;

        if (transparencyTrail is null)
            return false;

        return transparencyTrail.Skipped.Exists(entry =>
            string.Equals(entry.QuestionKey, mustKey, StringComparison.OrdinalIgnoreCase));
    }
}
