using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Formats an <see cref="AgentEvidencePackage" /> as a Markdown document, producing sections for
///     request context, constraints, capabilities, assumptions, policy evidence, service catalog hints,
///     pattern hints, prior manifest context, and evidence notes.
/// </summary>
public sealed class MarkdownEvidenceSummaryFormatter : IEvidenceSummaryFormatter
{
    /// <inheritdoc />
    public string FormatMarkdown(AgentEvidencePackage evidence)
    {
        ArgumentNullException.ThrowIfNull(evidence);

        RequestEvidence request = evidence.Request;

        StringBuilder sb = new();

        sb.AppendLine("## Evidence Context");
        sb.AppendLine();

        sb.AppendLine("### Request");
        sb.AppendLine();
        sb.AppendLine(
            $"- System Name: {MarkdownEvidenceSummaryExportHonesty.FormatInline(evidence.SystemName, MarkdownEvidenceSummaryExportHonesty.SystemNameNotStored)}");
        sb.AppendLine(
            $"- Environment: {MarkdownEvidenceSummaryExportHonesty.FormatInline(evidence.Environment, MarkdownEvidenceSummaryExportHonesty.EnvironmentNotStored)}");
        sb.AppendLine(
            $"- Cloud Provider: {MarkdownEvidenceSummaryExportHonesty.FormatInline(evidence.CloudProvider, MarkdownEvidenceSummaryExportHonesty.CloudProviderNotStored)}");
        sb.AppendLine(
            $"- Description: {MarkdownEvidenceSummaryExportHonesty.FormatInline(request.Description, MarkdownEvidenceSummaryExportHonesty.DescriptionNotStored)}");

        if (request.Constraints.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Constraints");
            sb.AppendLine();

            foreach (string constraint in request.Constraints)

                sb.AppendLine($"- {constraint}");
        }

        if (request.RequiredCapabilities.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Required Capabilities");
            sb.AppendLine();

            foreach (string capability in request.RequiredCapabilities)

                sb.AppendLine($"- {capability}");
        }

        if (request.Assumptions.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Assumptions");
            sb.AppendLine();

            foreach (string assumption in request.Assumptions)

                sb.AppendLine($"- {assumption}");
        }

        if (evidence.Policies.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Policy Evidence");
            sb.AppendLine();

            foreach (PolicyEvidence policy in evidence.Policies.OrderBy(p => p.Title))
            {
                string title = MarkdownEvidenceSummaryExportHonesty.FormatInline(
                    policy.Title,
                    MarkdownEvidenceSummaryExportHonesty.PolicyTitleNotStored);
                sb.AppendLine($"- **{title}**");
                sb.AppendLine(
                    $"  - Policy ID: {MarkdownEvidenceSummaryExportHonesty.FormatInline(policy.PolicyId, MarkdownEvidenceSummaryExportHonesty.PolicyIdNotStored)}");
                sb.AppendLine(
                    $"  - Summary: {MarkdownEvidenceSummaryExportHonesty.FormatInline(policy.Summary, MarkdownEvidenceSummaryExportHonesty.PolicySummaryNotStored)}");

                sb.AppendLine(
                    policy.RequiredControls.Count > 0
                        ? $"  - Required Controls: {string.Join(", ", policy.RequiredControls)}"
                        : $"  - Required Controls: {MarkdownEvidenceSummaryExportHonesty.RequiredControlsNotStored}");

                sb.AppendLine(
                    policy.Tags.Count > 0
                        ? $"  - Tags: {string.Join(", ", policy.Tags)}"
                        : $"  - Tags: {MarkdownEvidenceSummaryExportHonesty.TagsNotStored}");
            }
        }

        if (evidence.ServiceCatalog.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Service Catalog Hints");
            sb.AppendLine();

            foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(s => s.ServiceName))
            {
                string serviceName = MarkdownEvidenceSummaryExportHonesty.FormatInline(
                    service.ServiceName,
                    MarkdownEvidenceSummaryExportHonesty.ServiceNameNotStored);
                sb.AppendLine($"- **{serviceName}**");
                sb.AppendLine(
                    $"  - Category: {MarkdownEvidenceSummaryExportHonesty.FormatInline(service.Category, MarkdownEvidenceSummaryExportHonesty.ServiceCategoryNotStored)}");
                sb.AppendLine(
                    $"  - Summary: {MarkdownEvidenceSummaryExportHonesty.FormatInline(service.Summary, MarkdownEvidenceSummaryExportHonesty.ServiceSummaryNotStored)}");

                sb.AppendLine(
                    service.RecommendedUseCases.Count > 0
                        ? $"  - Recommended Use Cases: {string.Join(", ", service.RecommendedUseCases)}"
                        : $"  - Recommended Use Cases: {MarkdownEvidenceSummaryExportHonesty.RecommendedUseCasesNotStored}");

                sb.AppendLine(
                    service.Tags.Count > 0
                        ? $"  - Tags: {string.Join(", ", service.Tags)}"
                        : $"  - Tags: {MarkdownEvidenceSummaryExportHonesty.TagsNotStored}");
            }
        }

        if (evidence.Patterns.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Pattern Hints");
            sb.AppendLine();

            foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(p => p.Name))
            {
                string patternName = MarkdownEvidenceSummaryExportHonesty.FormatInline(
                    pattern.Name,
                    MarkdownEvidenceSummaryExportHonesty.PatternNameNotStored);
                sb.AppendLine($"- **{patternName}**");
                sb.AppendLine(
                    $"  - Pattern ID: {MarkdownEvidenceSummaryExportHonesty.FormatInline(pattern.PatternId, MarkdownEvidenceSummaryExportHonesty.PatternIdNotStored)}");
                sb.AppendLine(
                    $"  - Summary: {MarkdownEvidenceSummaryExportHonesty.FormatInline(pattern.Summary, MarkdownEvidenceSummaryExportHonesty.PatternSummaryNotStored)}");

                sb.AppendLine(
                    pattern.ApplicableCapabilities.Count > 0
                        ? $"  - Applicable Capabilities: {string.Join(", ", pattern.ApplicableCapabilities)}"
                        : $"  - Applicable Capabilities: {MarkdownEvidenceSummaryExportHonesty.ApplicableCapabilitiesNotStored}");

                sb.AppendLine(
                    pattern.SuggestedServices.Count > 0
                        ? $"  - Suggested Services: {string.Join(", ", pattern.SuggestedServices)}"
                        : $"  - Suggested Services: {MarkdownEvidenceSummaryExportHonesty.SuggestedServicesNotStored}");
            }
        }

        if (evidence.PriorManifest is not null)
        {
            sb.AppendLine();
            sb.AppendLine("### Prior Manifest Context");
            sb.AppendLine();
            sb.AppendLine(
                $"- Manifest Version: {MarkdownEvidenceSummaryExportHonesty.FormatInline(evidence.PriorManifest.ManifestVersion, MarkdownEvidenceSummaryExportHonesty.ManifestVersionNotStored)}");
            sb.AppendLine(
                $"- Summary: {MarkdownEvidenceSummaryExportHonesty.FormatInline(evidence.PriorManifest.Summary, MarkdownEvidenceSummaryExportHonesty.PriorManifestSummaryNotStored)}");

            sb.AppendLine(
                evidence.PriorManifest.ExistingServices.Count > 0
                    ? $"- Existing Services: {string.Join(", ", evidence.PriorManifest.ExistingServices)}"
                    : $"- Existing Services: {MarkdownEvidenceSummaryExportHonesty.ExistingServicesNotStored}");

            sb.AppendLine(
                evidence.PriorManifest.ExistingDatastores.Count > 0
                    ? $"- Existing Datastores: {string.Join(", ", evidence.PriorManifest.ExistingDatastores)}"
                    : $"- Existing Datastores: {MarkdownEvidenceSummaryExportHonesty.ExistingDatastoresNotStored}");

            sb.AppendLine(
                evidence.PriorManifest.ExistingRequiredControls.Count > 0
                    ? $"- Existing Required Controls: {string.Join(", ", evidence.PriorManifest.ExistingRequiredControls)}"
                    : $"- Existing Required Controls: {MarkdownEvidenceSummaryExportHonesty.ExistingRequiredControlsNotStored}");
        }

        if (evidence.Notes.Count <= 0)
            return sb.ToString();

        sb.AppendLine();
        sb.AppendLine("### Evidence Notes");
        sb.AppendLine();

        foreach (EvidenceNote note in evidence.Notes)
        {
            string noteType = MarkdownEvidenceSummaryExportHonesty.FormatInline(
                note.NoteType,
                MarkdownEvidenceSummaryExportHonesty.NoteTypeNotStored);
            string message = MarkdownEvidenceSummaryExportHonesty.FormatInline(
                note.Message,
                MarkdownEvidenceSummaryExportHonesty.NoteMessageNotStored);
            sb.AppendLine($"- **{noteType}**: {message}");
        }

        return sb.ToString();
    }
}
