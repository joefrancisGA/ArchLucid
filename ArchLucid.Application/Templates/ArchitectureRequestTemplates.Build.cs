using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Templates;

public static partial class ArchitectureRequestTemplates
{
    private const string TemplateIdDocumentName = "ArchLucid.TemplateId";

    private static ArchitectureRequest Build(string templateId, string? requestId, string title, string descriptionBody, string systemName, string environment,
        CloudProvider cloudProvider, List<string> assumptions, List<string> constraints, List<string> requiredCapabilities,
        IReadOnlyList<(string Name, string Content)> evidenceDocuments, List<string> topologyHints, List<string> securityBaselineHints)
    {
        if (string.IsNullOrWhiteSpace(templateId))
            throw new ArgumentException("Template id is required.", nameof(templateId));
        List<ContextDocumentRequest> docs =
        [
            new() { Name = TemplateIdDocumentName, ContentType = "text/plain", Content = templateId }
        ];
        docs.AddRange(evidenceDocuments.Select(doc => new ContextDocumentRequest { Name = doc.Name, ContentType = "text/markdown", Content = doc.Content }));
        string description = $"{title}\n\n{descriptionBody}".Trim();
        return new ArchitectureRequest
        {
            RequestId = string.IsNullOrWhiteSpace(requestId) ? Guid.NewGuid().ToString("N") : requestId.Trim(),
            Description = description,
            SystemName = systemName,
            Environment = environment,
            CloudProvider = cloudProvider,
            Assumptions = assumptions,
            Constraints = constraints,
            RequiredCapabilities = requiredCapabilities,
            Documents = docs,
            TopologyHints = topologyHints,
            SecurityBaselineHints = securityBaselineHints,
            InlineRequirements = [],
            PolicyReferences = [],
            InfrastructureDeclarations = [],
            PriorManifestVersion = null
        };
    }
}
