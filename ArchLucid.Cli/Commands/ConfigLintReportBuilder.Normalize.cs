using ArchLucid.Core.Hosting;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigLintReportBuilder
{
    private static void PromoteHostedPilotQualityGateFindings(
        List<ConfigLintReportFinding> blocking,
        List<ConfigLintReportFinding> advisory)
    {
        string[] promotedRuleNames =
        [
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike,
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGatePilotStrictThresholdsTooLooseInProductionLike,
        ];

        List<ConfigLintReportFinding> promoted = advisory
            .Where(f => promotedRuleNames.Contains(f.RuleName, StringComparer.Ordinal))
            .Select(static f => new ConfigLintReportFinding
            {
                RuleName = f.RuleName,
                Message = f.Message,
                Severity = "BLOCK",
                Category = f.Category,
                WhyItMatters = f.WhyItMatters,
                ConfigKeys = f.ConfigKeys,
                RemediationHint = f.RemediationHint,
                ExpectedProofArtifact = f.ExpectedProofArtifact,
            })
            .ToList();

        if (promoted.Count == 0)
            return;

        advisory.RemoveAll(f => promotedRuleNames.Contains(f.RuleName, StringComparer.Ordinal));

        blocking.AddRange(promoted);
    }

    private static ConfigLintReportFinding ToFinding(HostingMisconfigurationWarning warning, string severity)
    {
        ConfigLintFindingGuidance.Guidance? guidance = ConfigLintFindingGuidance.TryResolve(warning.RuleName);

        return new ConfigLintReportFinding
        {
            RuleName = warning.RuleName,
            Message = warning.Message,
            Severity = severity,
            Category = CategoryForRule(warning.RuleName),
            WhyItMatters = guidance?.WhyItMatters ?? string.Empty,
            ConfigKeys = guidance?.ConfigKeys ?? string.Empty,
            RemediationHint = guidance?.RemediationHint ?? "Review the detail column and docs/library/CONFIGURATION_REFERENCE.md.",
            ExpectedProofArtifact = guidance?.ExpectedProofArtifact ?? "config-lint-production-like-hosted-pilot.json",
        };
    }

    private static string CategoryForRule(string ruleName)
    {
        if (string.IsNullOrWhiteSpace(ruleName))
            return "Configuration";

        if (ruleName.Contains("auth", StringComparison.OrdinalIgnoreCase)
            || ruleName.Contains("jwt", StringComparison.OrdinalIgnoreCase)
            || ruleName.Contains("api_key", StringComparison.OrdinalIgnoreCase))
            return "Auth mode posture";

        if (ruleName.Contains("telemetry", StringComparison.OrdinalIgnoreCase))
            return "Telemetry export expectation";

        if (ruleName.Contains("llm", StringComparison.OrdinalIgnoreCase)
            || ruleName.Contains("redaction", StringComparison.OrdinalIgnoreCase))
            return "LLM / content safety posture";

        if (ruleName.Contains("openai", StringComparison.OrdinalIgnoreCase)
            || ruleName.Contains("connectivity", StringComparison.OrdinalIgnoreCase))
            return "Azure OpenAI real-mode readiness";

        if (ruleName.Contains("quality_gate", StringComparison.OrdinalIgnoreCase))
            return "Quality-gate posture";

        if (ruleName.Contains("azure_ai_search", StringComparison.OrdinalIgnoreCase)
            || ruleName.Contains("retrieval", StringComparison.OrdinalIgnoreCase))
            return "Azure AI Search / retrieval posture";

        if (ruleName.Contains("cors", StringComparison.OrdinalIgnoreCase))
            return "Browser client posture";

        return "Production-like hosting validation";
    }
}
