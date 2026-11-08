namespace ArchLucid.Decisioning.Advisory.Analysis;

internal static class ImprovementSignalAnalyzerHonesty
{
    internal const string StatusNotStored = "status was not stored";

    internal const string SeverityNotStored = "Severity was not stored";

    internal static string FormatSecurityRegressionDescription(string? baseStatus, string? targetStatus)
    {
        string from = string.IsNullOrWhiteSpace(baseStatus) ? StatusNotStored : baseStatus.Trim();
        string to = string.IsNullOrWhiteSpace(targetStatus) ? StatusNotStored : targetStatus.Trim();

        return $"{from} → {to}";
    }

    internal static string FormatDecisionRemovedDescription(string? baseValue)
    {
        if (string.IsNullOrWhiteSpace(baseValue))
            return "Previous value was not stored.";

        return $"Previously: {baseValue.Trim()}";
    }

    internal static string FormatMonthlyCostIncreaseDescription(decimal baseCost, decimal targetCost)
    {
        return
            $"Monthly max cost {baseCost:0.00} → {targetCost:0.00}. Currency was not stored.";
    }

    internal static string FormatUncoveredRequirementTitle(string requirementName)
    {
        if (string.IsNullOrWhiteSpace(requirementName))
            return "Requirement not covered (requirement name was not stored)";

        return $"Requirement not covered: {requirementName.Trim()}";
    }

    internal static string FormatUncoveredRequirementDescription(string? requirementText)
    {
        if (string.IsNullOrWhiteSpace(requirementText))
            return "Requirement text was not stored.";

        return requirementText.Trim();
    }

    internal static string FormatPolicyViolationTitle(string? controlName)
    {
        if (string.IsNullOrWhiteSpace(controlName))
            return "Policy violation. Control name was not stored.";

        return $"Policy violation: {controlName.Trim()}";
    }

    internal static string FormatPolicyViolationDescription(string? description, string? controlId)
    {
        if (!string.IsNullOrWhiteSpace(description))
            return description.Trim();

        List<string> parts = ["Policy violation description was not stored."];

        if (!string.IsNullOrWhiteSpace(controlId))
            parts.Add($"Control id: {controlId.Trim()}.");

        return string.Join(" ", parts);
    }
}
