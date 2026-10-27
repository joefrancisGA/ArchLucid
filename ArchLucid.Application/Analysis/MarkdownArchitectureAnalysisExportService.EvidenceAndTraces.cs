using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService
{
    private static void AppendEvidenceAndTraces(StringBuilder sb, ArchitectureAnalysisReport report)
    {
        sb.AppendLine("## Evidence Package");
        sb.AppendLine();

        if (report.Evidence is null)
        {
            sb.AppendLine(ArchitectureEvidenceRequestExport.MissingEvidencePackageCopy);
            sb.AppendLine();
        }
        else
        {
            AgentEvidencePackage evidence = report.Evidence;

            sb.AppendLine(
                $"- Evidence Package ID: {ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.EvidencePackageId, ArchitectureEvidenceRequestExport.MissingEvidencePackageIdCopy)}");
            sb.AppendLine(
                $"- System Name: {ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.SystemName, ArchitectureEvidenceRequestExport.MissingSystemNameCopy)}");
            sb.AppendLine(
                $"- Environment: {ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.Environment, ArchitectureEvidenceRequestExport.MissingEnvironmentCopy)}");
            sb.AppendLine(
                $"- Cloud Provider: {ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.CloudProvider, ArchitectureEvidenceRequestExport.MissingCloudProviderCopy)}");
            sb.AppendLine();

            sb.AppendLine("### Request Context");
            sb.AppendLine();

            sb.AppendLine(
                $"- Description: {ArchitectureEvidenceRequestExport.FormatDescription(evidence.Request.Description)}");

            if (evidence.Request.Constraints.Count > 0)
            {
                sb.AppendLine("- Constraints:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    evidence.Request.Constraints.Select(static item => $"  - {item}")));
            }
            else
            {
                sb.AppendLine($"- Constraints: {ArchitectureEvidenceRequestExport.ConstraintsNotRecordedCopy}");
            }

            if (evidence.Request.RequiredCapabilities.Count > 0)
            {
                sb.AppendLine("- Required Capabilities:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    evidence.Request.RequiredCapabilities.Select(static item => $"  - {item}")));
            }
            else
            {
                sb.AppendLine(
                    $"- Required Capabilities: {ArchitectureEvidenceRequestExport.RequiredCapabilitiesNotRecordedCopy}");
            }

            if (evidence.Request.Assumptions.Count > 0)
            {
                sb.AppendLine("- Assumptions:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    evidence.Request.Assumptions.Select(static item => $"  - {item}")));
            }
            else
            {
                sb.AppendLine($"- Assumptions: {ArchitectureEvidenceRequestExport.AssumptionsNotRecordedCopy}");
            }

            sb.AppendLine();

            sb.AppendLine("### Policy Evidence");
            sb.AppendLine();

            if (evidence.Policies.Count > 0)
            {
                foreach (PolicyEvidence policy in evidence.Policies.OrderBy(x => x.Title))
                {
                    string policyTitle = string.IsNullOrWhiteSpace(policy.Title)
                        ? ArchitectureEvidenceRequestExport.PolicyTitleNotStoredCopy
                        : policy.Title.Trim();
                    string policyId = string.IsNullOrWhiteSpace(policy.PolicyId)
                        ? ArchitectureEvidenceRequestExport.PolicyIdNotStoredCopy
                        : policy.PolicyId.Trim();
                    sb.AppendLine($"- **{policyTitle}**");
                    sb.AppendLine($"  - Policy ID: {policyId}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy)}");

                    sb.AppendLine(
                        policy.RequiredControls.Count > 0
                            ? $"  - Required Controls: {string.Join(", ", policy.RequiredControls)}"
                            : $"  - Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotStoredCopy}");
                }
            }
            else
            {
                sb.AppendLine($"- {ArchitectureEvidenceRequestExport.NoPolicyEvidenceRowsStoredCopy}");
            }

            sb.AppendLine();

            sb.AppendLine("### Service Catalog Hints");
            sb.AppendLine();

            if (evidence.ServiceCatalog.Count > 0)
            {
                foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(x => x.ServiceName))
                {
                    string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                        ? ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy
                        : service.ServiceName.Trim();
                    string category = string.IsNullOrWhiteSpace(service.Category)
                        ? ArchitectureEvidenceRequestExport.ServiceCategoryNotStoredCopy
                        : service.Category.Trim();
                    sb.AppendLine($"- **{serviceName}**");
                    sb.AppendLine($"  - Category: {category}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(service.Summary, ArchitectureEvidenceRequestExport.ServiceCatalogSummaryNotStoredCopy)}");

                    if (service.RecommendedUseCases.Count > 0)
                    {
                        sb.AppendLine($"  - Recommended Use Cases: {string.Join(", ", service.RecommendedUseCases)}");
                    }
                    else
                    {
                        sb.AppendLine(
                            $"  - Recommended Use Cases: {ArchitectureEvidenceRequestExport.RecommendedUseCasesNotStoredCopy}");
                    }
                }
            }
            else
            {
                sb.AppendLine($"- {ArchitectureEvidenceRequestExport.NoServiceCatalogRowsStoredCopy}");
            }

            sb.AppendLine();

            sb.AppendLine("### Pattern Hints");
            sb.AppendLine();

            if (evidence.Patterns.Count > 0)
            {
                foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(x => x.Name))
                {
                    string patternName = string.IsNullOrWhiteSpace(pattern.Name)
                        ? ArchitectureEvidenceRequestExport.PatternNameNotStoredCopy
                        : pattern.Name.Trim();
                    string patternId = string.IsNullOrWhiteSpace(pattern.PatternId)
                        ? ArchitectureEvidenceRequestExport.PatternIdNotStoredCopy
                        : pattern.PatternId.Trim();
                    sb.AppendLine($"- **{patternName}**");
                    sb.AppendLine($"  - Pattern ID: {patternId}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(pattern.Summary, ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy)}");

                    sb.AppendLine(
                        pattern.SuggestedServices.Count > 0
                            ? $"  - Suggested Services: {string.Join(", ", pattern.SuggestedServices)}"
                            : $"  - Suggested Services: {ArchitectureEvidenceRequestExport.SuggestedServicesNotStoredCopy}");
                }
            }
            else
            {
                sb.AppendLine($"- {ArchitectureEvidenceRequestExport.NoPatternRowsStoredCopy}");
            }

            sb.AppendLine();
        }

        sb.AppendLine("## Agent Execution Traces");
        sb.AppendLine();

        if (report.ExecutionTraces.Count == 0)
        {
            sb.AppendLine("- No execution traces were found for this run.");
            sb.AppendLine();
        }
        else

            foreach (AgentExecutionTrace trace in report.ExecutionTraces
                         .OrderBy(x => x.AgentType)
                         .ThenBy(x => x.CreatedUtc))
            {
                string taskLabel = string.IsNullOrWhiteSpace(trace.TaskId)
                    ? ArchitectureEvidenceRequestExport.TraceTaskIdNotStoredCopy
                    : trace.TaskId.Trim();
                sb.AppendLine($"### {trace.AgentType} — Task {taskLabel}");
                sb.AppendLine();
                sb.AppendLine($"- Trace ID: {trace.TraceId}");
                sb.AppendLine($"- Parse Succeeded: {(trace.ParseSucceeded ? "Yes" : "No")}");
                sb.AppendLine($"- Created UTC: {trace.CreatedUtc:O}");

                if (!string.IsNullOrWhiteSpace(trace.ErrorMessage))

                    sb.AppendLine($"- Error: {trace.ErrorMessage}");

                sb.AppendLine();
                AppendTraceFieldSection(
                    sb,
                    "#### System Prompt",
                    trace.SystemPrompt,
                    ArchitectureEvidenceRequestExport.TraceSystemPromptNotStoredCopy,
                    ArchitectureEvidenceRequestExport.TraceSystemPromptStoredEmptyCopy);
                AppendTraceFieldSection(
                    sb,
                    "#### User Prompt",
                    trace.UserPrompt,
                    ArchitectureEvidenceRequestExport.TraceUserPromptNotStoredCopy,
                    ArchitectureEvidenceRequestExport.TraceUserPromptStoredEmptyCopy);
                AppendTraceFieldSection(
                    sb,
                    "#### Raw Response",
                    trace.RawResponse,
                    ArchitectureEvidenceRequestExport.TraceRawResponseNotStoredCopy,
                    ArchitectureEvidenceRequestExport.TraceRawResponseStoredEmptyCopy,
                    fenceLanguage: "json");
                AppendTraceFieldSection(
                    sb,
                    "#### Parsed Result",
                    trace.ParsedResultJson,
                    ArchitectureEvidenceRequestExport.TraceParsedResultNotStoredCopy,
                    ArchitectureEvidenceRequestExport.TraceParsedResultStoredEmptyCopy,
                    fenceLanguage: "json");
                sb.AppendLine();
            }
    }

    private static void AppendTraceFieldSection(
        StringBuilder sb,
        string heading,
        string? value,
        string notStoredCopy,
        string storedEmptyCopy,
        string fenceLanguage = "text")
    {
        sb.AppendLine(heading);
        sb.AppendLine();
        string formatted = ArchitectureEvidenceRequestExport.FormatTraceField(value, notStoredCopy, storedEmptyCopy);

        if (formatted == notStoredCopy || formatted == storedEmptyCopy)
        {
            sb.AppendLine(formatted);
        }
        else
        {
            sb.AppendLine($"```{fenceLanguage}");
            sb.AppendLine(formatted);
            sb.AppendLine("```");
        }

        sb.AppendLine();
    }
}
