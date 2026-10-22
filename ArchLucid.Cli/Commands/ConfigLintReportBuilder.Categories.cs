using System.Text;

using ArchLucid.Core.Hosting;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigLintReportBuilder
{
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
                Category = "Azure AI Search (retrieval)",
                EvaluatedVia =
                    "Blocking `azure_ai_search_*` rules — Retrieval:VectorIndex=AzureSearch + Retrieval:AzureSearch:Endpoint (owner 2026-05-29)",
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
                EvaluatedVia =
                    "Blocking `quality_gate_warn_only_in_real_production_like` and `quality_gate_pilot_strict_thresholds_too_loose_in_production_like` under production-like-hosted-pilot profile",
            },
            new ConfigLintReportCheckCategory
            {
                Category = "Billing safety",
                EvaluatedVia = "Proof pipeline pricing-quote-aging and ROI basis rows (companion proof artifact)",
            },
        ];
    }
}
