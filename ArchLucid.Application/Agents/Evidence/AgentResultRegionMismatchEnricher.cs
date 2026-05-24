using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Flags LLM service recommendations that may be unavailable in the tenant region.</summary>
public sealed class AgentResultRegionMismatchEnricher : IAgentResultPostExecutionEnricher
{
    /// <inheritdoc />
    public Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(results);

        string defaultRegion = ResolveDefaultRegion(request);

        foreach (AgentResult result in results)
        {
            ManifestDeltaProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            foreach (ManifestService service in proposal.AddedServices)
            {
                string region = string.IsNullOrWhiteSpace(service.AzureArmRegion) ? defaultRegion : service.AzureArmRegion.Trim();
                TryAppendRegionWarning(proposal, region, ResolveRegionValidationPlatformHint(service.RuntimePlatform));
            }

            foreach (ManifestDatastore datastore in proposal.AddedDatastores)
            {
                string region = string.IsNullOrWhiteSpace(datastore.AzureArmRegion) ? defaultRegion : datastore.AzureArmRegion.Trim();
                TryAppendRegionWarning(proposal, region, ResolveRegionValidationPlatformHint(datastore.RuntimePlatform));
            }
        }

        return Task.CompletedTask;
    }

    private static string ResolveDefaultRegion(ArchitectureRequest request)
    {
        foreach (string constraint in request.Constraints)
        {
            if (!constraint.StartsWith("region:", StringComparison.OrdinalIgnoreCase))
                continue;

            string[] parts = constraint.Split(':', 2, StringSplitOptions.TrimEntries);

            if (parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[1]))
                return parts[1];
        }

        return string.Empty;
    }

    private static void TryAppendRegionWarning(ManifestDeltaProposal proposal, string tenantRegion, string suggestedPlatform)
    {
        if (string.IsNullOrWhiteSpace(tenantRegion) || string.IsNullOrWhiteSpace(suggestedPlatform))
            return;

        string? warning = ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning(tenantRegion, suggestedPlatform);

        if (warning is null)
            return;

        if (proposal.Warnings.Contains(warning, StringComparer.Ordinal))
            return;

        proposal.Warnings.Add(warning);
    }

    private static string ResolveRegionValidationPlatformHint(RuntimePlatform platform)
    {
        if (platform == RuntimePlatform.AzureOpenAi)
            return "Microsoft.CognitiveServices/accounts";

        return platform.ToString();
    }
}
