using System.Text;
using System.Text.Json;

using ArchLucid.Core.Hosting;

namespace ArchLucid.Cli.Commands;

internal static class ConfigLintReportBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
    };

    internal static ConfigLintReportDocument Build(
        OperatorConfigurationLintSnapshot snapshot,
        string? profileName)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        IReadOnlyList<ConfigLintReportFinding> blocking = snapshot.BlockingFindings
            .Select(f => ToFinding(f, "BLOCK"))
            .ToList();

        IReadOnlyList<ConfigLintReportFinding> advisory = snapshot.AdvisoryFindings
            .Select(f => ToFinding(f, "WARN"))
            .ToList();

        return new ConfigLintReportDocument
        {
            ProfileName = profileName ?? string.Empty,
            HostingEnvironmentName = snapshot.HostingEnvironmentName,
            Ok = blocking.Count == 0,
            BlockingFindings = blocking,
            AdvisoryFindings = advisory,
            CheckCategories = BuildCheckCategories(profileName),
        };
    }

    internal static string ToJson(ConfigLintReportDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return JsonSerializer.Serialize(document, JsonOptions);
    }

    internal static string ToMarkdown(ConfigLintReportDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        StringBuilder sb = new();
        sb.AppendLine("# Config lint report");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(document.ProfileName))
            sb.AppendLine($"**Profile:** `{document.ProfileName}`");

        sb.AppendLine($"**Hosting environment:** `{document.HostingEnvironmentName}`");
        sb.AppendLine($"**Disposition:** **{(document.Ok ? "PASS" : "HOLD")}**");
        sb.AppendLine();
        sb.AppendLine(
            "_Blocking findings must be cleared before production-like hosted sponsor handoff. Advisory findings are WARN-only._");
        sb.AppendLine();

        if (document.CheckCategories.Count > 0)
        {
            sb.AppendLine("## Profile check map");
            sb.AppendLine();
            sb.AppendLine("| Category | Evaluated via |");
            sb.AppendLine("| --- | --- |");

            foreach (ConfigLintReportCheckCategory row in document.CheckCategories)
                sb.AppendLine($"| {row.Category} | {row.EvaluatedVia} |");

            sb.AppendLine();
        }

        AppendFindingSection(sb, "Blocking findings", document.BlockingFindings);
        AppendFindingSection(sb, "Advisory findings", document.AdvisoryFindings);

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static void AppendFindingSection(
        StringBuilder sb,
        string heading,
        IReadOnlyList<ConfigLintReportFinding> findings)
    {
        sb.AppendLine($"## {heading}");
        sb.AppendLine();

        if (findings.Count == 0)
        {
            sb.AppendLine("_None._");
            sb.AppendLine();

            return;
        }

        sb.AppendLine("| Severity | Category | Rule | Why it matters | Config keys | Remediation | Proof artifact |");
        sb.AppendLine("| --- | --- | --- | --- | --- | --- | --- |");

        foreach (ConfigLintReportFinding finding in findings)
        {
            string detail = finding.Message.Replace("|", "\\|", StringComparison.Ordinal);
            string why = string.IsNullOrWhiteSpace(finding.WhyItMatters)
                ? detail
                : finding.WhyItMatters.Replace("|", "\\|", StringComparison.Ordinal);
            string keys = finding.ConfigKeys.Replace("|", "\\|", StringComparison.Ordinal);
            string remediation = finding.RemediationHint.Replace("|", "\\|", StringComparison.Ordinal);
            string artifact = finding.ExpectedProofArtifact.Replace("|", "\\|", StringComparison.Ordinal);
            sb.AppendLine(
                $"| {finding.Severity} | {finding.Category} | `{finding.RuleName}` | {why} | {keys} | {remediation} | {artifact} |");
        }

        sb.AppendLine();
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

        if (ruleName.Contains("cors", StringComparison.OrdinalIgnoreCase))
            return "Browser client posture";

        return "Production-like hosting validation";
    }

    private static IReadOnlyList<ConfigLintReportCheckCategory> BuildCheckCategories(string? profileName)
    {
        if (!string.Equals(profileName, ConfigLintProfileNames.ProductionLikeHostedPilot, StringComparison.Ordinal))
            return [];

        return
        [
            new ConfigLintReportCheckCategory
            {
                Category = "SQL / storage",
                EvaluatedVia = "Pilot preflight `config:ConnectionStrings` and `/health/ready` (companion proof rows)",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Auth mode / no dev bypass",
                EvaluatedVia = "Blocking lint rules (`auth_mode_*`, `authentication_api_key_development_bypass_all_disallowed`)",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Azure OpenAI real-mode keys",
                EvaluatedVia = "Advisory connectivity lint when real LLM endpoints are configured",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Content safety / prompt redaction",
                EvaluatedVia = "Blocking `llm_prompt_redaction_required_for_real_mode` under strict production validation",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Telemetry export",
                EvaluatedVia = "Blocking `telemetry_export_required_but_not_configured` when `ProductionValidation:RequireTelemetryExport=true`",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Quality-gate posture",
                EvaluatedVia = "First-pilot proof PilotStrict / agent-quality rows (companion proof artifact)",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Billing safety",
                EvaluatedVia = "Proof pipeline pricing-quote-aging and ROI basis rows (companion proof artifact)",
            },
        ];
    }
}
