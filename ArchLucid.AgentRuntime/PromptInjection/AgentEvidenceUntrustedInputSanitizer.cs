using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.AgentRuntime.PromptInjection;

/// <inheritdoc cref="IAgentEvidenceUntrustedInputSanitizer" />
public sealed class AgentEvidenceUntrustedInputSanitizer : IAgentEvidenceUntrustedInputSanitizer
{
    /// <inheritdoc />
    public Task SanitizeAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        cancellationToken.ThrowIfCancellationRequested();

        RequestEvidence request = evidence.Request;

        request.Description = AzureResourceTagPromptSanitizer.SanitizeScalar(request.Description);

        SanitizeStringList(request.Constraints);
        SanitizeStringList(request.RequiredCapabilities);
        SanitizeStringList(request.Assumptions);

        foreach (PolicyEvidence policy in evidence.Policies)
        {
            policy.Title = AzureResourceTagPromptSanitizer.SanitizeScalar(policy.Title);
            policy.Summary = AzureResourceTagPromptSanitizer.SanitizeScalar(policy.Summary);
            SanitizeStringList(policy.RequiredControls);
            SanitizeStringList(policy.Tags);
        }

        foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog)
        {
            service.ServiceName = AzureResourceTagPromptSanitizer.SanitizeScalar(service.ServiceName);
            service.Summary = AzureResourceTagPromptSanitizer.SanitizeScalar(service.Summary);
            SanitizeStringList(service.RecommendedUseCases);
        }

        foreach (PatternEvidence pattern in evidence.Patterns)
        {
            pattern.Name = AzureResourceTagPromptSanitizer.SanitizeScalar(pattern.Name);
            pattern.Summary = AzureResourceTagPromptSanitizer.SanitizeScalar(pattern.Summary);
            SanitizeStringList(pattern.SuggestedServices);
        }

        if (evidence.PriorManifest is not null)
        {
            PriorManifestEvidence prior = evidence.PriorManifest;

            prior.Summary = AzureResourceTagPromptSanitizer.SanitizeScalar(prior.Summary);
            SanitizeStringList(prior.ExistingServices);
            SanitizeStringList(prior.ExistingDatastores);
            SanitizeStringList(prior.ExistingRequiredControls);
        }

        foreach (EvidenceNote note in evidence.Notes)
            note.Message = AzureResourceTagPromptSanitizer.SanitizeScalar(note.Message);

        return Task.CompletedTask;
    }

    private static void SanitizeStringList(List<string> rows)
    {
        for (int i = 0; i < rows.Count; i++)
            rows[i] = AzureResourceTagPromptSanitizer.SanitizeScalar(rows[i]);
    }
}
