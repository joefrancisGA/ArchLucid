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
                $"- Evidence Package ID: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.EvidencePackageId, ArchitectureEvidenceRequestExport.MissingEvidencePackageIdCopy))}");
            sb.AppendLine(
                $"- System Name: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.SystemName, ArchitectureEvidenceRequestExport.MissingSystemNameCopy))}");
            sb.AppendLine(
                $"- Environment: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.Environment, ArchitectureEvidenceRequestExport.MissingEnvironmentCopy))}");
            sb.AppendLine(
                $"- Cloud Provider: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatIdentityField(evidence.CloudProvider, ArchitectureEvidenceRequestExport.MissingCloudProviderCopy))}");
            sb.AppendLine();

            sb.AppendLine("### Request Context");
            sb.AppendLine();

            sb.AppendLine(
                $"- Description: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatDescription(evidence.Request.Description))}");

            if (evidence.Request.Constraints.Count > 0)
            {
                sb.AppendLine("- Constraints:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    evidence.Request.Constraints.Select(static item => $"  - {FormatMarkdownListText(item)}")));
            }
            else
            {
                sb.AppendLine($"- Constraints: {ArchitectureEvidenceRequestExport.ConstraintsNotRecordedCopy}");
            }

            if (evidence.Request.RequiredCapabilities.Count > 0)
            {
                sb.AppendLine("- Required Capabilities:");
                sb.AppendLine(string.Join(Environment.NewLine,
                    evidence.Request.RequiredCapabilities.Select(static item => $"  - {FormatMarkdownListText(item)}")));
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
                    evidence.Request.Assumptions.Select(static item => $"  - {FormatMarkdownListText(item)}")));
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
                        : FormatMarkdownListText(policy.Title);
                    string policyId = string.IsNullOrWhiteSpace(policy.PolicyId)
                        ? ArchitectureEvidenceRequestExport.PolicyIdNotStoredCopy
                        : FormatMarkdownListText(policy.PolicyId);
                    sb.AppendLine($"- **{policyTitle}**");
                    sb.AppendLine($"  - Policy ID: {policyId}");
                    sb.AppendLine(
                        $"  - Summary: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy))}");

                    sb.AppendLine(
                        policy.RequiredControls.Count > 0
                            ? $"  - Required Controls: {FormatMarkdownListText(string.Join(", ", policy.RequiredControls))}"
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
                        : FormatMarkdownListText(service.ServiceName);
                    string category = string.IsNullOrWhiteSpace(service.Category)
                        ? ArchitectureEvidenceRequestExport.ServiceCategoryNotStoredCopy
                        : FormatMarkdownListText(service.Category);
                    sb.AppendLine($"- **{serviceName}**");
                    sb.AppendLine($"  - Category: {category}");
                    sb.AppendLine(
                        $"  - Summary: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatSummary(service.Summary, ArchitectureEvidenceRequestExport.ServiceCatalogSummaryNotStoredCopy))}");

                    if (service.RecommendedUseCases.Count > 0)
                    {
                        sb.AppendLine($"  - Recommended Use Cases: {FormatMarkdownListText(string.Join(", ", service.RecommendedUseCases))}");
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
                        : FormatMarkdownListText(pattern.Name);
                    string patternId = string.IsNullOrWhiteSpace(pattern.PatternId)
                        ? ArchitectureEvidenceRequestExport.PatternIdNotStoredCopy
                        : FormatMarkdownListText(pattern.PatternId);
                    sb.AppendLine($"- **{patternName}**");
                    sb.AppendLine($"  - Pattern ID: {patternId}");
                    sb.AppendLine(
                        $"  - Summary: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatSummary(pattern.Summary, ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy))}");

                    sb.AppendLine(
                        pattern.SuggestedServices.Count > 0
                            ? $"  - Suggested Services: {FormatMarkdownListText(string.Join(", ", pattern.SuggestedServices))}"
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
                    : FormatMarkdownListText(trace.TaskId);
                sb.AppendLine($"### {trace.AgentType} — Task {taskLabel}");
                sb.AppendLine();
                sb.AppendLine($"- Trace ID: {FormatMarkdownListText(trace.TraceId)}");
                sb.AppendLine($"- Parse Succeeded: {(trace.ParseSucceeded ? "Yes" : "No")}");
                sb.AppendLine($"- Created UTC: {trace.CreatedUtc:O}");

                sb.AppendLine(
                    $"- Error: {FormatMarkdownListText(ArchitectureEvidenceRequestExport.FormatTraceErrorForExport(trace.ErrorMessage, trace.ParseSucceeded))}");

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
            AppendFencedMarkdownBlock(sb, fenceLanguage, formatted);
        }

        sb.AppendLine();
    }

    private static void AppendFencedMarkdownBlock(StringBuilder sb, string infoString, string content)
    {
        int longestRun = 0;
        int run = 0;

        foreach (char c in content)
        {
            if (c == '`')
            {
                run++;

                if (run > longestRun)
                    longestRun = run;
            }
            else
            {
                run = 0;
            }
        }

        int fenceLength = Math.Max(3, longestRun + 1);
        string fence = new string('`', fenceLength);
        sb.AppendLine(string.IsNullOrEmpty(infoString) ? fence : fence + infoString);
        sb.AppendLine(content);
        sb.AppendLine(fence);
    }
}
