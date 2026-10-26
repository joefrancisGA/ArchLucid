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
                    string policyTitle = ArchitectureEvidenceRequestExport.FormatIdentityField(
                        policy.Title,
                        ArchitectureEvidenceRequestExport.PolicyTitleNotStoredCopy);
                    sb.AppendLine($"- **{policyTitle}**");
                    sb.AppendLine(
                        $"  - Policy ID: {ArchitectureEvidenceRequestExport.FormatIdentityField(policy.PolicyId, ArchitectureEvidenceRequestExport.PolicyIdNotStoredCopy)}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy)}");

                    if (policy.RequiredControls.Count > 0)
                    {
                        sb.AppendLine($"  - Required Controls: {string.Join(", ", policy.RequiredControls)}");
                    }
                    else
                    {
                        sb.AppendLine(
                            $"  - Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotRecordedCopy}");
                    }
                }
            }
            else
            {
                sb.AppendLine(ArchitectureEvidenceRequestExport.PolicyEvidenceNotRecordedCopy);
            }

            sb.AppendLine();

            sb.AppendLine("### Service Catalog Hints");
            sb.AppendLine();

            if (evidence.ServiceCatalog.Count > 0)
            {
                foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(x => x.ServiceName))
                {
                    string serviceName = ArchitectureEvidenceRequestExport.FormatIdentityField(
                        service.ServiceName,
                        ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy);
                    sb.AppendLine($"- **{serviceName}**");
                    sb.AppendLine(
                        $"  - Category: {ArchitectureEvidenceRequestExport.FormatIdentityField(service.Category, ArchitectureEvidenceRequestExport.ServiceCategoryNotStoredCopy)}");
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
                sb.AppendLine(ArchitectureEvidenceRequestExport.ServiceCatalogEvidenceNotRecordedCopy);
            }

            sb.AppendLine();

            sb.AppendLine("### Pattern Hints");
            sb.AppendLine();

            if (evidence.Patterns.Count > 0)
            {
                foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(x => x.Name))
                {
                    string patternName = ArchitectureEvidenceRequestExport.FormatIdentityField(
                        pattern.Name,
                        ArchitectureEvidenceRequestExport.PatternNameNotStoredCopy);
                    sb.AppendLine($"- **{patternName}**");
                    sb.AppendLine(
                        $"  - Pattern ID: {ArchitectureEvidenceRequestExport.FormatIdentityField(pattern.PatternId, ArchitectureEvidenceRequestExport.PatternIdNotStoredCopy)}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(pattern.Summary, ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy)}");

                    if (pattern.SuggestedServices.Count > 0)
                    {
                        sb.AppendLine($"  - Suggested Services: {string.Join(", ", pattern.SuggestedServices)}");
                    }
                }
            }
            else
            {
                sb.AppendLine(ArchitectureEvidenceRequestExport.PatternEvidenceNotRecordedCopy);
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
                sb.AppendLine("#### System Prompt");
                sb.AppendLine();
                sb.AppendLine("```text");
                sb.AppendLine(
                    ArchitectureEvidenceRequestExport.FormatTraceField(
                        trace.SystemPrompt,
                        ArchitectureEvidenceRequestExport.TraceSystemPromptNotStoredCopy,
                        ArchitectureEvidenceRequestExport.TraceSystemPromptStoredEmptyCopy));
                sb.AppendLine("```");
                sb.AppendLine();

                sb.AppendLine("#### User Prompt");
                sb.AppendLine();
                sb.AppendLine("```text");
                sb.AppendLine(
                    ArchitectureEvidenceRequestExport.FormatTraceField(
                        trace.UserPrompt,
                        ArchitectureEvidenceRequestExport.TraceUserPromptNotStoredCopy,
                        ArchitectureEvidenceRequestExport.TraceUserPromptStoredEmptyCopy));
                sb.AppendLine("```");
                sb.AppendLine();

                sb.AppendLine("#### Raw Response");
                sb.AppendLine();
                sb.AppendLine("```json");
                sb.AppendLine(
                    ArchitectureEvidenceRequestExport.FormatTraceField(
                        trace.RawResponse,
                        ArchitectureEvidenceRequestExport.TraceRawResponseNotStoredCopy,
                        ArchitectureEvidenceRequestExport.TraceRawResponseStoredEmptyCopy));
                sb.AppendLine("```");
                sb.AppendLine();

                sb.AppendLine("#### Parsed Result");
                sb.AppendLine();
                sb.AppendLine("```json");
                sb.AppendLine(
                    ArchitectureEvidenceRequestExport.FormatTraceField(
                        trace.ParsedResultJson,
                        ArchitectureEvidenceRequestExport.TraceParsedResultNotStoredCopy,
                        ArchitectureEvidenceRequestExport.TraceParsedResultStoredEmptyCopy));
                sb.AppendLine("```");
                sb.AppendLine();
            }
    }
}
