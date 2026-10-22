using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Clarifications;

/// <summary>Human-readable prompts for findings-derived clarification questions.</summary>
public static class ReviewClarificationQuestionPromptBuilder
{
    public static string Build(string findingType, string missingItem)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingType);

        string item = string.IsNullOrWhiteSpace(missingItem) ? "this gap" : $"'{missingItem.Trim()}'";

        if (string.Equals(findingType, FindingTypes.TopologyCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which system or integration covers the missing topology category {item}?";

        if (string.Equals(findingType, FindingTypes.PolicyCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which policy control should cover uncovered resource {item}?";

        if (string.Equals(findingType, FindingTypes.SecurityCoverageFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which security control protects {item}?";

        if (string.Equals(findingType, FindingTypes.SecurityBaselineCompletenessFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which security baseline control family satisfies {item}?";

        if (string.Equals(findingType, FindingTypes.PolicyApplicabilityFinding, StringComparison.OrdinalIgnoreCase))
            return $"Which topology resources should policy {item} apply to?";

        if (string.Equals(findingType, "RequiredCapabilityCoverageFinding", StringComparison.OrdinalIgnoreCase))
            return $"Which topology, security, or requirement evidence satisfies required capability {item}?";

        return $"What evidence or design detail resolves assessment gap {item}?";
    }
}
