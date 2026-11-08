using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
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

        IReadOnlyList<string> requestRegions = ResolveRequestRegions(request);

        foreach (AgentResult result in results)
        {
            if (result is null)
                continue;

            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            foreach (ManifestService service in proposal.AddedServices ?? [])
            {
                if (service is null)
                    continue;

                AppendRegionWarnings(
                    proposal,
                    service.AzureArmRegion,
                    requestRegions,
                    ResolveRegionValidationPlatformHint(service.RuntimePlatform, service.ServiceName));
            }

            foreach (ManifestDatastore datastore in proposal.AddedDatastores ?? [])
            {
                if (datastore is null)
                    continue;

                AppendRegionWarnings(
                    proposal,
                    datastore.AzureArmRegion,
                    requestRegions,
                    ResolveRegionValidationPlatformHint(datastore.RuntimePlatform, datastore.DatastoreName));
            }
        }

        return Task.CompletedTask;
    }

    private static IReadOnlyList<string> ResolveRequestRegions(ArchitectureRequest request)
    {
        List<string> regions = [];

        foreach (string constraint in request.Constraints ?? [])
        {
            if (string.IsNullOrWhiteSpace(constraint))
                continue;

            string trimmedConstraint = constraint.Trim();

            if (!trimmedConstraint.StartsWith("region:", StringComparison.OrdinalIgnoreCase))
                continue;

            string[] parts = trimmedConstraint.Split(':', 2, StringSplitOptions.TrimEntries);

            if (parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[1]))
                regions.Add(parts[1]);
        }

        return regions;
    }

    private static void AppendRegionWarnings(
        AgentTopologyProposal proposal,
        string? resourceRegion,
        IReadOnlyList<string> requestRegions,
        string suggestedPlatform)
    {
        if (!string.IsNullOrWhiteSpace(resourceRegion))
        {
            TryAppendRegionWarning(proposal, resourceRegion.Trim(), suggestedPlatform);

            return;
        }

        foreach (string requestRegion in requestRegions)
            TryAppendRegionWarning(proposal, requestRegion, suggestedPlatform);
    }

    private static void TryAppendRegionWarning(AgentTopologyProposal proposal, string tenantRegion, string suggestedPlatform)
    {
        if (string.IsNullOrWhiteSpace(tenantRegion) || string.IsNullOrWhiteSpace(suggestedPlatform))
            return;

        string? warning = ArchitectureRecommendationRegionValidator.TryGetRegionMismatchWarning(tenantRegion, suggestedPlatform);

        if (warning is null)
            return;

        proposal.Warnings ??= [];

        if (proposal.Warnings.Contains(warning, StringComparer.Ordinal))
            return;

        proposal.Warnings.Add(warning);
    }

    private static string ResolveRegionValidationPlatformHint(RuntimePlatform platform, string? resourceName)
    {
        if (platform == RuntimePlatform.AzureOpenAi)
            return "Microsoft.CognitiveServices/accounts";

        if (platform == RuntimePlatform.Unknown && !string.IsNullOrWhiteSpace(resourceName))
        {
            string? armHint = TryResolveRestrictedServiceHintFromResourceName(resourceName);

            if (armHint is not null)
                return armHint;
        }

        return platform.ToString();
    }

    private static string? TryResolveRestrictedServiceHintFromResourceName(string resourceName)
    {
        if (resourceName.Contains("openai", StringComparison.OrdinalIgnoreCase))
            return "Microsoft.CognitiveServices/accounts";

        if (resourceName.Contains("machine learning", StringComparison.OrdinalIgnoreCase)
            || resourceName.Contains("machinelearning", StringComparison.OrdinalIgnoreCase))
        {
            return "Microsoft.MachineLearningServices/workspaces";
        }

        return null;
    }
}
