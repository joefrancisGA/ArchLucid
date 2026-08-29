using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService
{
    private static void AppendEvidenceAndTraces(StringBuilder sb, ArchitectureAnalysisReport report)
    {
        if (report.Evidence is not null)
        {
            sb.AppendLine("## Evidence Package");
            sb.AppendLine();
            sb.AppendLine($"- Evidence Package ID: {report.Evidence.EvidencePackageId}");
            sb.AppendLine($"- System Name: {report.Evidence.SystemName}");
            sb.AppendLine($"- Environment: {report.Evidence.Environment}");
            sb.AppendLine($"- Cloud Provider: {report.Evidence.CloudProvider}");
            sb.AppendLine();

            sb.AppendLine("### Request Context");
            sb.AppendLine();

            sb.AppendLine($"- Description: {report.Evidence.Request.Description}");

            if (report.Evidence.Request.Constraints.Count > 0)
            {
                sb.AppendLine("- Constraints:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    report.Evidence.Request.Constraints.Select(static item => $"  - {item}")));
            }

            if (report.Evidence.Request.RequiredCapabilities.Count > 0)
            {
                sb.AppendLine("- Required Capabilities:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    report.Evidence.Request.RequiredCapabilities.Select(static item => $"  - {item}")));
            }

            if (report.Evidence.Request.Assumptions.Count > 0)
            {
                sb.AppendLine("- Assumptions:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    report.Evidence.Request.Assumptions.Select(static item => $"  - {item}")));
            }

            sb.AppendLine();

            if (report.Evidence.Policies.Count > 0)
            {
                sb.AppendLine("### Policy Evidence");
                sb.AppendLine();

                foreach (PolicyEvidence policy in report.Evidence.Policies.OrderBy(x => x.Title))
                {
                    sb.AppendLine($"- **{policy.Title}**");
                    sb.AppendLine($"  - Policy ID: {policy.PolicyId}");
                    sb.AppendLine($"  - Summary: {policy.Summary}");

                    if (policy.RequiredControls.Count > 0)

                        sb.AppendLine($"  - Required Controls: {string.Join(", ", policy.RequiredControls)}");
                }

                sb.AppendLine();
            }

            if (report.Evidence.ServiceCatalog.Count > 0)
            {
                sb.AppendLine("### Service Catalog Hints");
                sb.AppendLine();

                foreach (ServiceCatalogEvidence service in report.Evidence.ServiceCatalog.OrderBy(x => x.ServiceName))
                {
                    sb.AppendLine($"- **{service.ServiceName}**");
                    sb.AppendLine($"  - Category: {service.Category}");
                    sb.AppendLine($"  - Summary: {service.Summary}");

                    if (service.RecommendedUseCases.Count > 0)

                        sb.AppendLine($"  - Recommended Use Cases: {string.Join(", ", service.RecommendedUseCases)}");
                }

                sb.AppendLine();
            }

            if (report.Evidence.Patterns.Count > 0)
            {
                sb.AppendLine("### Pattern Hints");
                sb.AppendLine();

                foreach (PatternEvidence pattern in report.Evidence.Patterns.OrderBy(x => x.Name))
                {
                    sb.AppendLine($"- **{pattern.Name}**");
                    sb.AppendLine($"  - Pattern ID: {pattern.PatternId}");
                    sb.AppendLine($"  - Summary: {pattern.Summary}");

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
                sb.AppendLine($"### {trace.AgentType} — Task {trace.TaskId}");
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

                if (string.IsNullOrWhiteSpace(trace.ParsedResultJson))
                    continue;

                sb.AppendLine("#### Parsed Result");
                sb.AppendLine();
                sb.AppendLine("```json");
                sb.AppendLine(trace.ParsedResultJson);
                sb.AppendLine("```");
                sb.AppendLine();
            }
    }
}
