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
}
