using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffAcknowledgmentResolver
{
    private static readonly string[] AcceptanceTokens =
    [
        "acceptable",
        "accept",
        "acknowledged",
        "acknowledge",
        "intentional",
        "tradeoff",
        "prioritize",
    ];

    public static string? ResolveAcknowledgmentAnswerKey(
        TransparencyTrail trail,
        WafTradeoffCatalogEntry catalogEntry)
    {
        ArgumentNullException.ThrowIfNull(trail);
        ArgumentNullException.ThrowIfNull(catalogEntry);

        string sacrificedPillarQuestionKey = WafPillarIntakeKeys.ToL0QuestionKey(catalogEntry.SacrificedPillar);
        string gainedPillarQuestionKey = WafPillarIntakeKeys.ToL0QuestionKey(catalogEntry.GainedPillar);

        foreach (AssertedTrailEntry entry in trail.Asserted)
        {
            if (!IsRelevantAnswerKey(entry.Key, sacrificedPillarQuestionKey, gainedPillarQuestionKey))
                continue;

            if (AcceptsSacrifice(entry.Value, catalogEntry))
                return entry.Key;
        }

        return null;
    }

    private static bool IsRelevantAnswerKey(
        string key,
        string sacrificedPillarQuestionKey,
        string gainedPillarQuestionKey)
    {
        if (string.Equals(key, $"answer.{sacrificedPillarQuestionKey}", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, sacrificedPillarQuestionKey, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(key, $"answer.{gainedPillarQuestionKey}", StringComparison.OrdinalIgnoreCase)
            || string.Equals(key, gainedPillarQuestionKey, StringComparison.OrdinalIgnoreCase))
            return true;

        return key.StartsWith("answer.", StringComparison.OrdinalIgnoreCase);
    }

    private static bool AcceptsSacrifice(string answerValue, WafTradeoffCatalogEntry catalogEntry)
    {
        if (string.IsNullOrWhiteSpace(answerValue))
            return false;

        string normalizedAnswer = answerValue.ToLowerInvariant();

        if (ContainsRejectionPhrase(normalizedAnswer))
            return false;

        if (normalizedAnswer.Contains(catalogEntry.MechanismLabel.ToLowerInvariant(), StringComparison.Ordinal))
            return true;

        foreach (string signature in catalogEntry.DetectionSignatures)
        {
            if (normalizedAnswer.Contains(signature, StringComparison.Ordinal))
                return true;
        }

        return ContainsAcceptanceToken(normalizedAnswer);
    }

    private static bool ContainsRejectionPhrase(string normalizedAnswer) =>
        normalizedAnswer.Contains("unacceptable", StringComparison.Ordinal)
        || normalizedAnswer.Contains("deprioritize", StringComparison.Ordinal)
        || normalizedAnswer.Contains("do not accept", StringComparison.Ordinal)
        || normalizedAnswer.Contains("not acceptable", StringComparison.Ordinal)
        || normalizedAnswer.Contains("reject", StringComparison.Ordinal);

    private static bool ContainsAcceptanceToken(string normalizedAnswer)
    {
        foreach (string token in AcceptanceTokens)
        {
            if (ContainsWholeToken(normalizedAnswer, token))
                return true;
        }

        return false;
    }

    private static bool ContainsWholeToken(string normalizedAnswer, string token)
    {
        int searchStart = 0;

        while (searchStart <= normalizedAnswer.Length - token.Length)
        {
            int index = normalizedAnswer.IndexOf(token, searchStart, StringComparison.Ordinal);

            if (index < 0)
                return false;

            if (HasWholeTokenBoundary(normalizedAnswer, index, token.Length)
                && !IsTokenNegated(normalizedAnswer, index))
                return true;

            searchStart = index + 1;
        }

        return false;
    }

    private static bool HasWholeTokenBoundary(string normalizedAnswer, int tokenStartIndex, int tokenLength)
    {
        if (tokenStartIndex > 0 && char.IsLetterOrDigit(normalizedAnswer[tokenStartIndex - 1]))
            return false;

        int tokenEndIndex = tokenStartIndex + tokenLength;

        if (tokenEndIndex < normalizedAnswer.Length && char.IsLetterOrDigit(normalizedAnswer[tokenEndIndex]))
            return false;

        return true;
    }

    private static bool IsTokenNegated(string normalizedAnswer, int tokenStartIndex)
    {
        const int maxNegationLookback = 48;
        int windowStart = Math.Max(0, tokenStartIndex - maxNegationLookback);
        string prefix = normalizedAnswer[windowStart..tokenStartIndex].TrimEnd();

        return prefix.EndsWith("do not", StringComparison.Ordinal)
            || prefix.EndsWith("don't", StringComparison.Ordinal)
            || prefix.EndsWith("not", StringComparison.Ordinal)
            || prefix.EndsWith("no", StringComparison.Ordinal)
            || prefix.EndsWith("never", StringComparison.Ordinal);
    }
}
