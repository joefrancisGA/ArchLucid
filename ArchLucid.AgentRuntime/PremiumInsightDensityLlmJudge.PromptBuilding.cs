using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.AgentRuntime;

public sealed partial class PremiumInsightDensityLlmJudge
{
    private static string BuildEngineFindingUserPrompt(Finding finding)
    {
        StringBuilder builder = new();

        builder.AppendLine("Judge this ONE deterministic engine finding for insight density.");
        builder.AppendLine();
        builder.AppendLine("Candidate finding JSON:");
        builder.AppendLine("{");
        builder.AppendLine($"  \"findingId\": \"{finding.FindingId}\",");
        builder.AppendLine($"  \"engineType\": \"{EscapeJson(finding.EngineType)}\",");
        builder.AppendLine($"  \"severity\": \"{finding.Severity}\",");
        builder.AppendLine($"  \"title\": \"{EscapeJson(finding.Title)}\",");
        builder.AppendLine($"  \"rationale\": \"{EscapeJson(finding.Rationale)}\",");
        builder.AppendLine($"  \"category\": \"{EscapeJson(finding.Category)}\"");
        builder.AppendLine("}");
        builder.AppendLine();
        builder.AppendLine("Engine evidence summary (cite ONLY refs present here):");
        builder.AppendLine(InsightDensityEngineFindingEvidenceSummary.Build(finding));

        return builder.ToString();
    }

    private static string BuildUserPrompt(
        ArchitectureFinding finding,
        ArchitectureRequest request,
        AgentEvidencePackage evidence)
    {
        StringBuilder builder = new();

        builder.AppendLine("Judge this ONE candidate finding for insight density.");
        builder.AppendLine();
        builder.AppendLine($"SystemName: {request.SystemName}");
        builder.AppendLine($"Environment: {request.Environment}");
        builder.AppendLine($"CloudProvider: {request.CloudProvider}");
        builder.AppendLine();
        builder.AppendLine("Candidate finding JSON:");
        builder.AppendLine("{");
        builder.AppendLine($"  \"findingId\": \"{finding.FindingId}\",");
        builder.AppendLine($"  \"severity\": \"{finding.Severity}\",");
        builder.AppendLine($"  \"message\": \"{EscapeJson(finding.Message)}\",");
        builder.AppendLine($"  \"evidenceRefs\": [{string.Join(", ", finding.EvidenceRefs.Select(static reference => $"\"{reference}\""))}]");
        builder.AppendLine("}");
        builder.AppendLine();
        builder.AppendLine("Evidence package summary (cite ONLY refs present here or on the candidate):");
        builder.AppendLine(InsightDensityJudgeEvidenceSummary.Build(evidence, request));

        return builder.ToString();
    }

    private static string EscapeJson(string value) =>
        System.Text.Json.JsonSerializer.Serialize(value).Trim('"');

    private bool IsLlmJudgeOperational()
    {
        if (!_gateOptionsResolver.Resolve().EnableLlmJudge)
        {
            return false;
        }

        AgentModelTierOptions tiers = _tierOptions.CurrentValue;
        string? premiumDeployment = tiers.PremiumDeploymentName ?? _configuration["Llm:Deployments:Reasoning"];

        return !string.IsNullOrWhiteSpace(premiumDeployment);
    }
}
