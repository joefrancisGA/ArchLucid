using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Shared user-prompt sections for agent handlers (architecture request, evidence, task tools/sources) with sensitive
///     pattern redaction on free-text fields.
/// </summary>
public static class AgentUserPromptBuilder
{
    /// <summary>Run id, task id, and agent type label lines.</summary>
    public static void AppendRunHeader(StringBuilder sb, string runId, string taskId, string agentTypeLabel)
    {
        sb.AppendLine($"RunId: {runId}");
        sb.AppendLine($"TaskId: {taskId}");
        sb.AppendLine($"AgentType: {agentTypeLabel}");
        sb.AppendLine();
    }

    /// <summary>
    ///     Architecture request through evidence package and prior manifest (exclusive of task objective and tool/source
    ///     lists).
    /// </summary>
    public static void AppendArchitectureRequestAndEvidence(
        StringBuilder sb,
        ArchitectureRequest request,
        AgentEvidencePackage evidence)
    {
        sb.AppendLine("Architecture Request");
        sb.AppendLine($"RequestId: {request.RequestId}");
        sb.AppendLine($"SystemName: {request.SystemName}");
        sb.AppendLine($"Environment: {request.Environment}");
        sb.AppendLine($"CloudProvider: {request.CloudProvider}");
        sb.AppendLine($"Description: {PromptFieldRedactor.RedactForPrompt(request.Description)}");
        sb.AppendLine();

        if (request.Constraints.Count > 0)
        {
            sb.AppendLine("Constraints:");
            foreach (string constraint in request.Constraints)

                sb.AppendLine($"- {PromptFieldRedactor.RedactForPrompt(constraint)}");

            sb.AppendLine();
        }

        if (request.RequiredCapabilities.Count > 0)
        {
            sb.AppendLine("Required Capabilities:");
            foreach (string capability in request.RequiredCapabilities)

                sb.AppendLine($"- {PromptFieldRedactor.RedactForPrompt(capability)}");

            sb.AppendLine();
        }

        if (request.Assumptions.Count > 0)
        {
            sb.AppendLine("Assumptions:");
            foreach (string assumption in request.Assumptions)

                sb.AppendLine($"- {PromptFieldRedactor.RedactForPrompt(assumption)}");

            sb.AppendLine();
        }

        sb.AppendLine("Evidence Package");
        sb.AppendLine($"EvidencePackageId: {evidence.EvidencePackageId}");
        sb.AppendLine();

        if (evidence.Policies.Count > 0)
        {
            sb.AppendLine("Policies:");
            foreach (PolicyEvidence policy in evidence.Policies)
            {
                sb.AppendLine(
                    $"- {PromptFieldRedactor.RedactForPrompt(policy.Title)}: {PromptFieldRedactor.RedactForPrompt(policy.Summary)}");
                if (policy.RequiredControls.Count > 0)

                    sb.AppendLine($"  RequiredControls: {string.Join(", ", policy.RequiredControls)}");
            }

            sb.AppendLine();
        }

        if (evidence.ServiceCatalog.Count > 0)
        {
            sb.AppendLine("Service Catalog Hints:");
            foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog)
            {
                sb.AppendLine($"- {service.ServiceName}: {PromptFieldRedactor.RedactForPrompt(service.Summary)}");
                if (service.RecommendedUseCases.Count > 0)

                    sb.AppendLine($"  UseCases: {string.Join(", ", service.RecommendedUseCases)}");
            }

            sb.AppendLine();
        }

        if (evidence.Patterns.Count > 0)
        {
            sb.AppendLine("Pattern Hints:");
            foreach (PatternEvidence pattern in evidence.Patterns)
            {
                sb.AppendLine($"- {pattern.Name}: {PromptFieldRedactor.RedactForPrompt(pattern.Summary)}");
                sb.AppendLine($"  SuggestedServices: {string.Join(", ", pattern.SuggestedServices)}");
            }

            sb.AppendLine();
        }

        if (evidence.PriorManifest is null)
            return;

        sb.AppendLine("Prior Manifest:");
        sb.AppendLine($"  Version: {evidence.PriorManifest.ManifestVersion}");
        sb.AppendLine($"  Summary: {PromptFieldRedactor.RedactForPrompt(evidence.PriorManifest.Summary)}");
        sb.AppendLine();
    }

    /// <summary>Task objective, allowed tools, and allowed sources.</summary>
    public static void AppendTaskObjectiveToolsAndSources(StringBuilder sb, AgentTask task)
    {
        sb.AppendLine("Task Objective:");
        sb.AppendLine(PromptFieldRedactor.RedactForPrompt(task.Objective));
        sb.AppendLine();

        sb.AppendLine("Allowed Tools:");
        foreach (string tool in task.AllowedTools)

            sb.AppendLine($"- {tool}");

        sb.AppendLine();

        sb.AppendLine("Allowed Sources:");
        foreach (string source in task.AllowedSources)

            sb.AppendLine($"- {source}");

        sb.AppendLine();
    }
}
