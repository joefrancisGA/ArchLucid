using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Requests;

namespace ArchLucid.Application.Runs.Coordination;

/// <summary>
///     Shared evidence bundle and starter task construction for <see cref="ArchitectureRunAuthorityCoordination"/> and
///     deferred authority completion.
/// </summary>
public static class RunStarterTaskFactory
{
    private const string ToolServiceCatalogReader = "service-catalog-reader";
    private const string ToolPatternLibraryReader = "pattern-library-reader";
    private const string ToolPricingProfileReader = "pricing-profile-reader";
    private const string ToolCostEstimator = "cost-estimator";
    private const string ToolPolicyPackReader = "policy-pack-reader";
    private const string ToolControlMapper = "control-mapper";
    private const string SourceArchitectureRequest = "architecture-request";
    private const string SourcePolicyPack = "policy-pack";
    private const string SourceServiceCatalog = "service-catalog";
    private const string SourcePriorManifest = "prior-manifest";
    private const string SourcePricingProfile = "pricing-profile";
    private const string SourceAzureExtractorZip = "azure-extractor-zip";
    private const string SourceAwsExtractorZip = "aws-extractor-zip";
    private const string SourceGcpExtractorZip = "gcp-extractor-zip";

    /// <summary>Builds the evidence bundle injected into every starter agent task.</summary>
    public static EvidenceBundle BuildEvidenceBundle(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase)
        {
            ["systemName"] = request.SystemName,
            ["environment"] = request.Environment,
            ["cloudProvider"] = request.CloudProvider.ToString()
        };
        if (!string.IsNullOrWhiteSpace(request.PriorManifestVersion))
            metadata["priorManifestVersion"] = request.PriorManifestVersion;
        return new EvidenceBundle
        {
            EvidenceBundleId = Guid.NewGuid().ToString("N"),
            RequestDescription = request.Description,
            PolicyRefs = RunStarterCloudEvidenceRefs.BuildPolicyRefs(request),
            ServiceCatalogRefs = RunStarterCloudEvidenceRefs.BuildServiceCatalogRefs(request),
            PriorManifestRefs = string.IsNullOrWhiteSpace(request.PriorManifestVersion) ? [] : [request.PriorManifestVersion],
            Metadata = metadata
        };
    }

    /// <summary>Creates topology, cost, compliance, and critic starter tasks for the run.</summary>
    public static List<AgentTask> BuildStarterTasks(
        string runId,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        AgentModelExecutionProfile executionProfile = AgentModelExecutionProfile.Balanced)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(ledgerEntries);
        return
        [
            CreateTopologyTask(runId, evidenceBundle, request, ledgerEntries, executionProfile),
            CreateCostTask(runId, evidenceBundle, request, executionProfile),
            CreateComplianceTask(runId, evidenceBundle, request, executionProfile),
            CreateCriticTask(runId, evidenceBundle, request, executionProfile)
        ];
    }

    private static LlmModelTier ResolveModelTier(AgentType agentType, AgentModelExecutionProfile executionProfile)
    {
        return AgentModelExecutionProfileTierPolicy.ResolveTier(executionProfile, agentType);
    }

    private static AgentTask CreateTopologyTask(
        string runId,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        AgentModelExecutionProfile executionProfile)
    {
        return new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = TechnologyLedgerObjectiveComposer.BuildTopologyObjective(request, ledgerEntries),
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = evidenceBundle.EvidenceBundleId,
            AllowedTools = [AgentTypeKeys.Topology],
            AllowedSources = [SourceArchitectureRequest, SourcePolicyPack, SourceServiceCatalog, SourcePriorManifest],
            ModelTierOverride = ResolveModelTier(AgentType.Topology, executionProfile)
        };
    }

    private static AgentTask CreateCostTask(
        string runId,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        AgentModelExecutionProfile executionProfile)
    {
        return new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            AgentType = AgentType.Cost,
            Objective = BuildCostObjective(request, evidenceBundle),
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = evidenceBundle.EvidenceBundleId,
            AllowedTools = [AgentTypeKeys.Cost],
            AllowedSources = BuildCostAllowedSources(evidenceBundle),
            ModelTierOverride = ResolveModelTier(AgentType.Cost, executionProfile)
        };
    }

    private static List<string> BuildCostAllowedSources(EvidenceBundle evidenceBundle)
    {
        List<string> sources = [SourceArchitectureRequest, SourcePricingProfile, SourceServiceCatalog, SourcePriorManifest];

        if (AzureExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle))
            sources.Add(SourceAzureExtractorZip);

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle, CloudProvider.Aws))
            sources.Add(SourceAwsExtractorZip);

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle, CloudProvider.Gcp))
            sources.Add(SourceGcpExtractorZip);

        return sources;
    }

    private static AgentTask CreateComplianceTask(
        string runId,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        AgentModelExecutionProfile executionProfile)
    {
        return new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective = BuildComplianceObjective(request),
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = evidenceBundle.EvidenceBundleId,
            AllowedTools = [AgentTypeKeys.Compliance],
            AllowedSources = [SourceArchitectureRequest, SourcePolicyPack, SourceServiceCatalog, SourcePriorManifest],
            ModelTierOverride = ResolveModelTier(AgentType.Compliance, executionProfile)
        };
    }

    private static AgentTask CreateCriticTask(
        string runId,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest request,
        AgentModelExecutionProfile executionProfile)
    {
        return new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            AgentType = AgentType.Critic,
            Objective = BuildCriticObjective(request),
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = evidenceBundle.EvidenceBundleId,
            AllowedTools = [AgentTypeKeys.Critic],
            AllowedSources = [SourceArchitectureRequest, SourcePolicyPack, SourceServiceCatalog, SourcePriorManifest],
            ModelTierOverride = ResolveModelTier(AgentType.Critic, executionProfile)
        };
    }

    private static string BuildCostObjective(ArchitectureRequest request, EvidenceBundle evidenceBundle)
    {
        string baseText =
            $"Estimate cost posture and cost-sensitive design considerations for system '{request.SystemName}'. " +
            $"Required capabilities: {string.Join(", ", request.RequiredCapabilities)}";

        string? cite = TryResolveInventoryCostCitation(evidenceBundle);

        if (string.IsNullOrWhiteSpace(cite))
            return baseText;

        return baseText + " Inventory citation: " + cite;
    }

    private static string? TryResolveInventoryCostCitation(EvidenceBundle evidenceBundle)
    {
        if (AzureExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle)
            && evidenceBundle.Metadata.TryGetValue(
                AzureExtractorEvidenceBundleMerger.MetadataCostCitationKey,
                out string? azureCite)
            && !string.IsNullOrWhiteSpace(azureCite))
            return azureCite;

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle, CloudProvider.Aws)
            && evidenceBundle.Metadata.TryGetValue(
                CloudInventoryExtractorEvidenceBundleMerger.MetadataCostCitationKey(CloudProvider.Aws),
                out string? awsCite)
            && !string.IsNullOrWhiteSpace(awsCite))
            return awsCite;

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(evidenceBundle, CloudProvider.Gcp)
            && evidenceBundle.Metadata.TryGetValue(
                CloudInventoryExtractorEvidenceBundleMerger.MetadataCostCitationKey(CloudProvider.Gcp),
                out string? gcpCite)
            && !string.IsNullOrWhiteSpace(gcpCite))
            return gcpCite;

        return null;
    }

    private static string BuildComplianceObjective(ArchitectureRequest request)
    {
        return $"Validate the proposed architecture for system '{request.SystemName}' " +
               $"against policy constraints: {string.Join(", ", request.Constraints)}";
    }

    private static string BuildCriticObjective(ArchitectureRequest request)
    {
        return $"Critique the implied architecture for system '{request.SystemName}' " + $"and identify omissions, contradictions, or weak assumptions " +
               $"that may undermine enterprise readiness or governance.";
    }
}
