using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Clarifications;

/// <summary>Human-readable prompts for findings-derived clarification questions.</summary>
public static class ReviewClarificationQuestionPromptBuilder
{
    public static string Build(string findingType, string missingItem)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingType);

        string item = FormatMissingItemReference(missingItem);

        if (string.Equals(findingType, FindingTypes.TopologyCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which system or integration covers the missing topology category {item}?";

        if (string.Equals(findingType, FindingTypes.PolicyCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which policy control covers uncovered resource {item}?";

        if (string.Equals(findingType, FindingTypes.SecurityCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which security control applies to {item}?";

        if (string.Equals(findingType, FindingTypes.SecurityBaselineCompletenessFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which security baseline control family satisfies {item}?";

        if (string.Equals(findingType, FindingTypes.PolicyApplicabilityFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which topology resources does policy {item} apply to?";

        if (string.Equals(findingType, "RequiredCapabilityCoverageFinding", StringComparison.OrdinalIgnoreCase))
            return $"Which topology, security, or requirement evidence satisfies required capability {item}?";

        return $"What evidence or design detail resolves assessment gap {item}?";
    }

    internal const string MissingItemNotStoredCopy = "Missing item was not stored.";

    internal const string MissingItemStoredEmptyCopy = "Missing item was stored empty.";

    internal static string FormatMissingItemReference(string missingItem)
    {
        if (missingItem is null || missingItem.Length == 0)
        {
            return MissingItemNotStoredCopy;
        }

        if (missingItem.Trim().Length == 0)
        {
            return MissingItemStoredEmptyCopy;
        }

        string trimmed = missingItem.Trim();

        if (trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return $"Resource name was not stored. Stored reference: '{trimmed}'.";
        }

        return $"'{trimmed}'";
    }
}
