namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Detects Ask question intent for optional platform corpus and prior-manifest retrieval boosts.</summary>
public static class AskRetrievalIntentDetector
{
    private static readonly string[] PolicyPackKeywords =
    [
        "compliance",
        "control",
        "governance",
        "policy",
        "policies",
        "regulation",
        "rule",
        "rules",
        "hipaa",
        "pci",
        "soc2",
        "iso",
    ];

    private static readonly string[] PlatformDocKeywords =
    [
        "adr",
        "architecture decision",
        "corpus kind",
        "platform doc",
        "rag-v1",
        "v1 scope",
    ];

    private static readonly string[] PriorManifestKeywords =
    [
        "changed",
        "earlier",
        "evolution",
        "historical",
        "history",
        "previous",
        "prior",
        "why did",
        "why was",
        "over time",
    ];

    /// <summary>True when the question likely needs policy-pack rule grounding.</summary>
    public static bool DetectPolicyPackIntent(string question)
    {
        if (string.IsNullOrWhiteSpace(question))
            return false;

        string normalized = question.Trim();

        foreach (string keyword in PolicyPackKeywords)
        {
            if (normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>True when the question likely needs prior-run manifest context.</summary>
    public static bool DetectPriorManifestIntent(string question)
    {
        if (string.IsNullOrWhiteSpace(question))
            return false;

        string normalized = question.Trim();

        foreach (string keyword in PriorManifestKeywords)
        {
            if (normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>True when the question likely needs platform ADR / library doc grounding.</summary>
    public static bool DetectPlatformDocIntent(string question)
    {
        if (string.IsNullOrWhiteSpace(question))
            return false;

        string normalized = question.Trim();

        foreach (string keyword in PlatformDocKeywords)
        {
            if (normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
