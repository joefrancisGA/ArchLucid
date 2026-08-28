using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>Builds Cost-agent prompt sections from structured retail-price lookups — no embeddings.</summary>
public static partial class CostRetailGroundingBuilder
{
    public static CostRetailGroundingResult Build(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        CostRetailGroundingLookups lookups,
        CloudProvider? effectiveCloudTarget = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(lookups);

        CloudProvider? provider = ResolveGroundingProvider(request, evidence, effectiveCloudTarget);

        if (provider is null)
        {
            return new CostRetailGroundingResult(string.Empty, [], false, SkippedRetailGrounding: true, GroundedProvider: null);
        }

        return provider.Value switch
        {
            CloudProvider.Azure => BuildAzure(request, evidence, lookups.Azure, provider.Value),
            CloudProvider.Aws => BuildAws(request, evidence, lookups.Aws, provider.Value),
            CloudProvider.Gcp => BuildGcp(request, evidence, lookups.Gcp, provider.Value),
            _ => new CostRetailGroundingResult(string.Empty, [], false, SkippedRetailGrounding: true, GroundedProvider: null),
        };
    }

    internal static CloudProvider? ResolveGroundingProvider(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        CloudProvider? effectiveCloudTarget = null)
    {
        if (effectiveCloudTarget == CloudProvider.None)
            return null;

        if (effectiveCloudTarget is CloudProvider.Azure or CloudProvider.Aws or CloudProvider.Gcp)
            return effectiveCloudTarget;

        if (!string.IsNullOrWhiteSpace(evidence.CloudProvider))
        {
            if (evidence.CloudProvider.Contains("aws", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Aws;

            if (evidence.CloudProvider.Contains("gcp", StringComparison.OrdinalIgnoreCase)
                || evidence.CloudProvider.Contains("google", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Gcp;

            if (evidence.CloudProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Azure;
        }

        return request.CloudProvider switch
        {
            CloudProvider.Azure => CloudProvider.Azure,
            CloudProvider.Aws => CloudProvider.Aws,
            CloudProvider.Gcp => CloudProvider.Gcp,
            _ => null,
        };
    }

    internal static bool IsAzureProvider(CloudProvider requestProvider, string evidenceCloudProvider)
    {
        if (!string.IsNullOrWhiteSpace(evidenceCloudProvider)
            && !evidenceCloudProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
            return false;

        return requestProvider == CloudProvider.Azure;
    }

    private static IEnumerable<string> EnumerateRegionSources(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        yield return request.Description;

        foreach (string constraint in request.Constraints)
            yield return constraint;

        foreach (string assumption in request.Assumptions)
            yield return assumption;

        foreach (EvidenceNote note in evidence.Notes)
            yield return note.Message;
    }

    private static IEnumerable<string> EnumerateSkuSources(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        yield return request.Description;

        foreach (string constraint in request.Constraints)
            yield return constraint;

        foreach (ServiceCatalogEvidence entry in evidence.ServiceCatalog)
        {
            yield return entry.ServiceName;
            yield return entry.Summary;
        }
    }

    private readonly record struct CostRetailProbe(string ServiceName, string? Sku);
}
