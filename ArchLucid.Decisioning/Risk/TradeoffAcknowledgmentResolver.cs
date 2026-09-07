using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffAcknowledgmentResolver
{
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

        if (normalizedAnswer.Contains(catalogEntry.MechanismLabel.ToLowerInvariant(), StringComparison.Ordinal))
            return true;

        foreach (string signature in catalogEntry.DetectionSignatures)
        {
            if (normalizedAnswer.Contains(signature, StringComparison.Ordinal))
                return true;
        }

        return ContainsAcceptancePhrase(normalizedAnswer);
    }

    private static bool ContainsAcceptancePhrase(string normalizedAnswer) =>
        normalizedAnswer.Contains("accept", StringComparison.Ordinal)
        || normalizedAnswer.Contains("acknowledge", StringComparison.Ordinal)
        || normalizedAnswer.Contains("intentional", StringComparison.Ordinal)
        || normalizedAnswer.Contains("tradeoff", StringComparison.Ordinal)
        || normalizedAnswer.Contains("prioritize", StringComparison.Ordinal);
}
