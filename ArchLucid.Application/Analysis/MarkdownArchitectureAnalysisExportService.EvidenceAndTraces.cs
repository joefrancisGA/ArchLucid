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

            if (evidence.Policies.Count > 0)
            {
                sb.AppendLine("### Policy Evidence");
                sb.AppendLine();

                foreach (PolicyEvidence policy in evidence.Policies.OrderBy(x => x.Title))
                {
                    sb.AppendLine($"- **{policy.Title}**");
                    sb.AppendLine($"  - Policy ID: {policy.PolicyId}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy)}");

                    if (policy.RequiredControls.Count > 0)

                        sb.AppendLine($"  - Required Controls: {string.Join(", ", policy.RequiredControls)}");
                }

                sb.AppendLine();
            }

            if (evidence.ServiceCatalog.Count > 0)
            {
                sb.AppendLine("### Service Catalog Hints");
                sb.AppendLine();

                foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(x => x.ServiceName))
                {
                    sb.AppendLine($"- **{service.ServiceName}**");
                    sb.AppendLine($"  - Category: {service.Category}");
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

                sb.AppendLine();
            }

            if (evidence.Patterns.Count > 0)
            {
                sb.AppendLine("### Pattern Hints");
                sb.AppendLine();

                foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(x => x.Name))
                {
                    sb.AppendLine($"- **{pattern.Name}**");
                    sb.AppendLine($"  - Pattern ID: {pattern.PatternId}");
                    sb.AppendLine(
                        $"  - Summary: {ArchitectureEvidenceRequestExport.FormatSummary(pattern.Summary, ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy)}");

                    if (pattern.SuggestedServices.Count > 0)

                        sb.AppendLine($"  - Suggested Services: {string.Join(", ", pattern.SuggestedServices)}");
                }

                sb.AppendLine();
            }
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
                sb.AppendLine(trace.SystemPrompt);
                sb.AppendLine("```");
                sb.AppendLine();

                sb.AppendLine("#### User Prompt");
                sb.AppendLine();
                sb.AppendLine("```text");
                sb.AppendLine(trace.UserPrompt);
                sb.AppendLine("```");
                sb.AppendLine();

                sb.AppendLine("#### Raw Response");
                sb.AppendLine();
                sb.AppendLine("```json");
                sb.AppendLine(trace.RawResponse);
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
